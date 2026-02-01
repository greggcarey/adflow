import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let dbStatus = "unknown";
  let dbError = null;

  try {
    // Try a simple query to test database connection
    await db.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
    dbError = error instanceof Error ? error.message : "Unknown error";
  }

  return NextResponse.json({
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length || 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    dbStatus,
    dbError,
    nodeEnv: process.env.NODE_ENV,
  });
}
