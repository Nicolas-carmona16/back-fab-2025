import type { PrismaClient, User, Rol, Departamento, Ciudad } from "../generated/prisma"

export interface GraphQLContext {
  prisma: PrismaClient
  currentUser: UserWithRelations | null
}

export type UserWithRelations = User & {
  rol: Rol
  ciudad: Ciudad
  departamento: Departamento
}

