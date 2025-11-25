import type { ExpressContextFunctionArgument } from "@as-integrations/express5"
import { prisma } from "../config/prisma"
import type { GraphQLContext } from "../types/context"
import { verifyAccessToken } from "../auth/token"

export async function buildContext({ req }: ExpressContextFunctionArgument): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined
  const payload = verifyAccessToken(token)

  const currentUser = payload
    ? await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { rol: true, ciudad: true, departamento: true },
      })
    : null

  return {
    prisma,
    currentUser: currentUser ? (currentUser as any) : null,
  }
}

