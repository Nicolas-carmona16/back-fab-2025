import { PrismaClient, Prisma } from "../generated/prisma"

export const prisma = new PrismaClient({} as Prisma.PrismaClientOptions)

