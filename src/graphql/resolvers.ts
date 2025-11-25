import { type GraphQLContext, type UserWithRelations } from "../types/context"
import {
  createUsuario,
  deleteUsuario,
  getUsuarioById,
  searchUsuarios,
  toGraphQLUser,
  updateUsuario,
  type CreateUsuarioInput,
  type UpdateUsuarioInput,
} from "../modules/users/user.service"
import {
  listCiudadesByDepartamento,
  listDepartamentos,
  listRoles,
  searchCiudades,
  ensureDepartamento,
  ensureCiudad,
  ensureRol,
} from "../modules/catalog/catalog.service"
import { login, refresh, registerUser } from "../modules/auth/auth.service"
import { revokeToken } from "../auth/token"
import type { RegisterInput } from "../modules/auth/auth.service"
import { submitSurvey, listSurveys } from "../modules/survey/survey.service"
import type { SurveyInput } from "../modules/survey/survey.service"

function requireAuth(ctx: GraphQLContext, roles?: string[]) {
  if (!ctx.currentUser) {
    throw new Error("No autenticado")
  }
  if (roles && !roles.includes(ctx.currentUser.rol.nombreRol)) {
    throw new Error("No autorizado")
  }
  return ctx.currentUser
}

function buildAuthPayload(user: UserWithRelations, tokens: { accessToken: string; refreshToken: string }) {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    usuario: toGraphQLUser(user),
  }
}

export const resolvers = {
  Query: {
    me: (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) return null
      return toGraphQLUser(ctx.currentUser as UserWithRelations)
    },
    usuarioById: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN", "AGENTE"])
      const user = await getUsuarioById(args.id)
      return user ? toGraphQLUser(user as UserWithRelations) : null
    },
    searchUsuarios: async (_parent: unknown, args: { q?: string; page?: number; size?: number }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN", "AGENTE"])
      const page = args.page ?? 0
      const size = args.size ?? 10
      const result = await searchUsuarios(args.q, page, size)
      return {
        content: result.content.map((u) => toGraphQLUser(u as UserWithRelations)),
        pageInfo: result.pageInfo,
      }
    },
    roles: async (_parent: unknown, args: { page?: number; size?: number }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const result = await listRoles(args.page ?? 0, args.size ?? 50)
      return {
        content: result.content.map((rol) => ({
          idRol: rol.id,
          nombreRol: rol.nombreRol,
        })),
        pageInfo: result.pageInfo,
      }
    },
    departamentos: async (_parent: unknown, args: { page?: number; size?: number }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const result = await listDepartamentos(args.page ?? 0, args.size ?? 50)
      return {
        content: result.content.map((dep) => ({
          idDepartamento: dep.id,
          nombreDepartamento: dep.nombreDepartamento,
        })),
        pageInfo: result.pageInfo,
      }
    },
    ciudadesByDepartamento: async (
      _parent: unknown,
      args: { idDepartamento: string; page?: number; size?: number },
      ctx: GraphQLContext,
    ) => {
      requireAuth(ctx)
      const result = await listCiudadesByDepartamento(args.idDepartamento, args.page ?? 0, args.size ?? 50)
      return {
        content: result.content.map((c) => ({
          idCiudad: c.id,
          nombreCiudad: c.nombreCiudad,
          idDepartamento: c.departamentoId,
          nombreDepartamento: c.departamento.nombreDepartamento,
        })),
        pageInfo: result.pageInfo,
      }
    },
    searchCiudades: async (_parent: unknown, args: { q?: string; page?: number; size?: number }, ctx: GraphQLContext) => {
      requireAuth(ctx)
      const result = await searchCiudades(args.q ?? "", args.page ?? 0, args.size ?? 50)
      return {
        content: result.content.map((c) => ({
          idCiudad: c.id,
          nombreCiudad: c.nombreCiudad,
          idDepartamento: c.departamentoId,
          nombreDepartamento: c.departamento.nombreDepartamento,
        })),
        pageInfo: result.pageInfo,
      }
    },
    surveys: async (_parent: unknown, args: { page?: number; size?: number }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN"])
      const result = await listSurveys(args.page ?? 0, args.size ?? 20)
      return {
        content: result.content.map((survey) => ({
          id: survey.id,
          rating: survey.rating,
          comment: survey.comment,
          status: survey.status,
          createdAt: survey.createdAt.toISOString(),
          userId: survey.userId,
        })),
        pageInfo: result.pageInfo,
      }
    },
  },
  Mutation: {
    registerUser: async (_: unknown, args: { input: RegisterInput }) => {
      const { user, tokens } = await registerUser(args.input)
      return buildAuthPayload(user as UserWithRelations, tokens)
    },
    login: async (_: unknown, args: { email: string; password: string }) => {
      const { user, tokens } = await login(args.email, args.password)
      return buildAuthPayload(user as UserWithRelations, tokens)
    },
    refreshToken: async (_: unknown, args: { refreshToken: string }) => {
      const { tokens, user } = await refresh(args.refreshToken)
      return buildAuthPayload(user as UserWithRelations, tokens)
    },
    logout: async (_: unknown, args: { refreshToken: string }) => {
      await revokeToken(args.refreshToken)
      return true
    },
    createUsuario: async (_: unknown, args: { input: CreateUsuarioInput }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN", "AGENTE"])
      const user = await createUsuario(args.input)
      return toGraphQLUser(user as UserWithRelations)
    },
    updateUsuario: async (_: unknown, args: { input: UpdateUsuarioInput }, ctx: GraphQLContext) => {
      const current = requireAuth(ctx)
      const isSelf = current.id === args.input.idUsuario
      if (!isSelf && !["ADMIN", "AGENTE"].includes(current.rol.nombreRol)) {
        throw new Error("No autorizado")
      }
      const user = await updateUsuario(args.input)
      return toGraphQLUser(user as UserWithRelations)
    },
    deleteUsuario: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN"])
      return deleteUsuario(args.id)
    },
    createDepartamento: async (_: unknown, args: { input: { nombreDepartamento: string } }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN"])
      const dep = await ensureDepartamento(args.input.nombreDepartamento)
      return {
        idDepartamento: dep.id,
        nombreDepartamento: dep.nombreDepartamento,
      }
    },
    createCiudad: async (_: unknown, args: { input: { nombreCiudad: string; idDepartamento: string } }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN", "AGENTE"])
      const ciudad = await ensureCiudad(args.input.nombreCiudad, args.input.idDepartamento)
      return {
        idCiudad: ciudad.id,
        nombreCiudad: ciudad.nombreCiudad,
        idDepartamento: ciudad.departamentoId,
        nombreDepartamento: ciudad.departamento.nombreDepartamento,
      }
    },
    createRol: async (_: unknown, args: { input: { nombreRol: string } }, ctx: GraphQLContext) => {
      requireAuth(ctx, ["ADMIN"])
      const rol = await ensureRol(args.input.nombreRol)
      return {
        idRol: rol.id,
        nombreRol: rol.nombreRol,
      }
    },
    submitSurvey: async (_: unknown, args: { input: SurveyInput }, ctx: GraphQLContext) => {
      const user = requireAuth(ctx)
      const survey = await submitSurvey(user.id, args.input)
      return {
        id: survey.id,
        rating: survey.rating,
        comment: survey.comment,
        status: survey.status,
        createdAt: survey.createdAt.toISOString(),
        userId: survey.userId,
      }
    },
  },
}

