import jwt, { type SignOptions } from "jsonwebtoken"
import { randomUUID } from "crypto"
import { env } from "../config/env"
import { prisma } from "../config/prisma"
import type { UserWithRelations } from "../types/context"

interface JwtPayload {
  sub: string
  roles: string[]
  email: string
  tokenId?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

function durationStringToMs(input: string): number {
  const value = input.trim()
  const match = value.match(/^(\d+)(ms|s|m|h|d|w)?$/i)
  if (!match) {
    throw new Error(`Duración inválida: ${input}`)
  }
  const amount = Number(match[1])
  const unit = (match[2] || "s").toLowerCase()
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  }
  const multiplier = unitMs[unit]
  if (!multiplier) {
    throw new Error(`Unidad de tiempo inválida: ${unit}`)
  }
  return amount * multiplier
}

function durationStringToSeconds(input: string): number {
  return Math.max(1, Math.floor(durationStringToMs(input) / 1000))
}

function signAccessToken(user: UserWithRelations): string {
  const payload: JwtPayload = {
    sub: user.id,
    roles: [user.rol.nombreRol],
    email: user.correo,
  }
  const options: SignOptions = { expiresIn: durationStringToSeconds(env.ACCESS_TOKEN_TTL) }
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options)
}

function signRefreshToken(user: UserWithRelations, tokenId: string): string {
  const payload: JwtPayload = {
    sub: user.id,
    roles: [user.rol.nombreRol],
    email: user.correo,
    tokenId,
  }
  const options: SignOptions = { expiresIn: durationStringToSeconds(env.REFRESH_TOKEN_TTL) }
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options)
}

export async function issueTokens(user: UserWithRelations): Promise<AuthTokens> {
  const tokenId = randomUUID()
  const accessToken = signAccessToken(user)
  const refreshToken = signRefreshToken(user, tokenId)
  const expiresAt = new Date(Date.now() + durationStringToMs(env.REFRESH_TOKEN_TTL))

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

export async function rotateRefreshToken(oldToken: string): Promise<{ tokens: AuthTokens; user: UserWithRelations }> {
  let decoded: JwtPayload
  try {
    decoded = jwt.verify(oldToken, env.JWT_REFRESH_SECRET) as JwtPayload
  } catch {
    throw new Error("Invalid refresh token")
  }

  const stored = await prisma.refreshToken.findFirst({
    where: { token: oldToken, revokedAt: null },
    include: {
      user: {
        include: {
          rol: true,
          ciudad: true,
          departamento: true,
        },
      },
    },
  })

  if (!stored || !stored.user) {
    throw new Error("Refresh token not found")
  }

  if (stored.expiresAt < new Date()) {
    throw new Error("Refresh token expired")
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  })

  const tokens = await issueTokens(stored.user as UserWithRelations)
  return { tokens, user: stored.user as UserWithRelations }
}

export async function revokeToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revokedAt: new Date() },
  })
}

export function verifyAccessToken(token?: string): JwtPayload | null {
  if (!token) return null
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload
  } catch {
    return null
  }
}

