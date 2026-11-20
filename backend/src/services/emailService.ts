interface PasswordResetEmailInput {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: PasswordResetEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    throw new Error('Password reset email is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Reset your LLB Platform password',
      text: `Hello ${name},\n\nUse this link to reset your LLB Platform password. It expires in 30 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
      html: `<p>Hello ${name},</p><p>Use the link below to reset your LLB Platform password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}
