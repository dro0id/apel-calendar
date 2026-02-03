import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

export const authAdapter = PrismaAdapter(prisma)
