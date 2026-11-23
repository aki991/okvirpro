import { PrismaClient } from "@prisma/client";

// Jedna instanca Prisma klijenta i u dev režimu (hot reload)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
