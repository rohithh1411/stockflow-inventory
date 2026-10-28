import { PrismaClient } from "@prisma/client";

// Reuse one client in dev so hot reload doesn't open many connections.
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
