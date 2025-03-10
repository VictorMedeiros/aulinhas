import { PrismaClient } from "@prisma/client";

// Create a singleton instance of PrismaClient
let prisma;

// Check if we're in production to avoid creating multiple instances during development
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, use global variable to store the client instance
  if (!global.__db) {
    global.__db = new PrismaClient();
  }
  prisma = global.__db;
}

export { prisma };
