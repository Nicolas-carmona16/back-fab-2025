import { prisma } from "../../config/prisma"
import { hashPassword, verifyPassword } from "../../auth/password"
import { ensureCiudad, ensureDepartamento, ensureRol } from "../catalog/catalog.service"
import { issueTokens, rotateRefreshToken, revokeToken } from "../../auth/token"
import type { UserWithRelations } from "../../types/context"

export interface RegisterInput {
  nombre: string
  correo: string
  password: string
  telefono: string
  detalleDireccion: string
  departamentoNombre: string
  ciudadNombre: string
  rolNombre: string
}

export async function registerUser(input: RegisterInput) {
  if (input.password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(input.password)) {
    throw new Error("La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números")
  }
  const existing = await prisma.user.findUnique({
    where: { correo: input.correo.toLowerCase() },
  })
  if (existing) throw new Error("El correo ya está registrado")

  const departamento = await ensureDepartamento(input.departamentoNombre)
  const rol = await ensureRol(input.rolNombre)
  const ciudad = await ensureCiudad(input.ciudadNombre, departamento.id)

  const user = await prisma.user.create({
    data: {
      nombre: input.nombre,
      correo: input.correo.toLowerCase(),
      telefono: input.telefono,
      detalleDireccion: input.detalleDireccion,
      passwordHash: await hashPassword(input.password),
      departamentoId: departamento.id,
      ciudadId: ciudad.id,
      rolId: rol.id,
    },
    include: {
      rol: true,
      ciudad: true,
      departamento: true,
    },
  })

  const tokens = await issueTokens(user as UserWithRelations)
  return { user, tokens }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { correo: email.toLowerCase() },
    include: { rol: true, ciudad: true, departamento: true },
  })
  if (!user || !user.passwordHash) {
    throw new Error("Credenciales inválidas")
  }
  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new Error("Credenciales inválidas")

  const tokens = await issueTokens(user as UserWithRelations)
  return { user, tokens }
}

export async function refresh(refreshToken: string) {
  return rotateRefreshToken(refreshToken)
}

export async function logout(refreshToken: string) {
  await revokeToken(refreshToken)
  return true
}

