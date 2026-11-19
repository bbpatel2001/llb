import serverless from "serverless-http";
import app from "../../backend/src/index";
import { connectDB } from "../../backend/src/config/database";

let databasePromise: ReturnType<typeof connectDB> | undefined;

export const handler = async (event: any, context: any) => {
  databasePromise ??= connectDB();
  await databasePromise;
  return serverless(app)(event, context);
};
