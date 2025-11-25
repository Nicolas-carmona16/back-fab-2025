import type { PrismaClient, User, Rol, Departamento, Ciudad } from "@prisma/client"

export interface GraphQLContext {
  prisma: PrismaClient
  currentUser: UserWithRelations | null
}

export type UserWithRelations = User & {
  rol: Rol
  ciudad: Ciudad
  departamento: Departamento
}

