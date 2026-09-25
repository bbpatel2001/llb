import { createInterface } from 'node:readline';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/User';

const CREATE_CONFIRMATION = 'CREATE ADMIN';

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

function askLine(question: string): Promise<string> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    terminal.question(question, (answer) => {
      terminal.close();
      resolve(answer);
    });
  });
}

function askSecret(question: string): Promise<string> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) throw new Error('ADMIN_PASSWORD is required when the command is run without an interactive terminal');
    return Promise.resolve(password);
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const previousRawMode = stdin.isRaw;
    let password = '';

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(previousRawMode ?? false);
      stdin.pause();
    };

    const onData = (chunk: Buffer) => {
      for (const character of chunk.toString()) {
        if (character === '\u0003') {
          cleanup();
          process.stdout.write('\n');
          reject(new Error('Admin creation cancelled'));
          return;
        }
        if (character === '\r' || character === '\n') {
          cleanup();
          process.stdout.write('\n');
          resolve(password);
          return;
        }
        if (character === '\u007f' || character === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          continue;
        }
        password += character;
        process.stdout.write('*');
      }
    };

    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

function printUsage(): void {
  console.log(`Create the first administrator account.

Interactive:
  npm run admin:create

For non-interactive deployments, provide ADMIN_NAME, ADMIN_EMAIL,
ADMIN_PASSWORD through a secret manager and set ADMIN_CONFIRM to:
  ${CREATE_CONFIRMATION}

The command creates a new admin only. It never changes an existing account.`);
}

async function createAdmin(): Promise<void> {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsage();
    return;
  }

  const name = (process.env.ADMIN_NAME || await askLine('Admin name: ')).trim();
  const email = (process.env.ADMIN_EMAIL || await askLine('Admin email: ')).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || await askSecret('Admin password: ');
  const confirmation = process.env.ADMIN_CONFIRM || await askLine(`Type ${CREATE_CONFIRMATION} to continue: `);

  if (name.length < 2 || name.length > 120) throw new Error('Name must be between 2 and 120 characters');
  if (!validEmail(email)) throw new Error('A valid email is required');
  if (!validPassword(password)) throw new Error('Password must be between 8 and 128 characters');
  if (confirmation.trim() !== CREATE_CONFIRMATION) throw new Error('Admin creation was not confirmed');

  await connectDB();
  try {
    const existing = await User.findOne({ email }).select('_id name email role active').lean();
    if (existing) {
      if (existing.role === 'admin' && existing.active) {
        console.log(`An active admin already exists for ${email}. No changes were made.`);
        return;
      }
      throw new Error(`An account already exists for ${email} with role=${existing.role} and active=${existing.active}. No changes were made.`);
    }

    try {
      const user = await User.create({
        name,
        email,
        passwordHash: password,
        role: 'admin',
        active: true,
        verified: true,
      });
      console.log(`Admin created successfully: ${user.email} (${user._id.toString()})`);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new Error(`An account already exists for ${email}. No changes were made.`);
      }
      throw error;
    }
  } finally {
    await disconnectDB();
  }
}

createAdmin().catch((error: unknown) => {
  if (mongoose.connection.readyState !== 0) void disconnectDB();
  console.error(`Admin creation failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
