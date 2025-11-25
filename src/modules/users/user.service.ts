import { Prisma } from "@prisma/client"
import { prisma } from "../../config/prisma"
import { buildPage, type Page } from "../../utils/pagination"
import type { UserWithRelations } from "../../types/context"

export interface CreateUsuarioInput {
  nombre: string
  correo: string
  telefono: string
  detalleDireccion: string
  idCiudad: string
  idDepartamento: string
  idRol: string
}

export interface UpdateUsuarioInput {
  idUsuario: string
  nombre?: string
  correo?: string
  telefono?: string
  detalleDireccion?: string
  idCiudad?: string
  idDepartamento?: string
  idRol?: string
}

export async function searchUsuarios(q: string | undefined, page: number, size: number): Promise<Page<UserWithRelations>> {
  const where =
    q && q.trim().length > 0
      ? {
          OR: [
            { nombre: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { correo: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : undefined

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip: page * size,
      take: size,
      orderBy: { fechaRegistro: "desc" },
      include: { rol: true, ciudad: true, departamento: true },
    }),
    prisma.user.count({ where }),
  ])

  return buildPage<UserWithRelations>(items as UserWithRelations[], total, page, size)
}

export async function getUsuarioById(id: string): Promise<UserWithRelations | null> {
  return prisma.user.findUnique({
    where: { id },
    include: { rol: true, ciudad: true, departamento: true },
  }) as Promise<UserWithRelations | null>
}

export async function createUsuario(input: CreateUsuarioInput): Promise<UserWithRelations> {
  return prisma.user.create({
    data: {
      nombre: input.nombre,
      correo: input.correo.toLowerCase(),
      telefono: input.telefono,
      detalleDireccion: input.detalleDireccion,
      ciudadId: input.idCiudad,
      departamentoId: input.idDepartamento,
      rolId: input.idRol,
      passwordHash: "", // se asigna vacío para usuarios creados desde admin
    },
    include: { rol: true, ciudad: true, departamento: true },
  }) as Promise<UserWithRelations>
}

export async function updateUsuario(input: UpdateUsuarioInput): Promise<UserWithRelations> {
  const data: Prisma.UserUpdateInput = {}
  if (input.nombre !== undefined) data.nombre = input.nombre
  if (input.correo !== undefined) data.correo = input.correo.toLowerCase()
  if (input.telefono !== undefined) data.telefono = input.telefono
  if (input.detalleDireccion !== undefined) data.detalleDireccion = input.detalleDireccion
  if (input.idCiudad !== undefined) data.ciudad = { connect: { id: input.idCiudad } }
  if (input.idDepartamento !== undefined) data.departamento = { connect: { id: input.idDepartamento } }
  if (input.idRol !== undefined) data.rol = { connect: { id: input.idRol } }

  return prisma.user.update({
    where: { id: input.idUsuario },
    data,
    include: { rol: true, ciudad: true, departamento: true },
  }) as Promise<UserWithRelations>
}

export async function deleteUsuario(id: string) {
  await prisma.user.delete({ where: { id } })
  return true
}

export function toGraphQLUser(user: UserWithRelations) {
  return {
    idUsuario: user.id,
    nombre: user.nombre,
    correo: user.correo,
    telefono: user.telefono,
    fechaRegistro: user.fechaRegistro.toISOString(),
    detalleDireccion: user.detalleDireccion,
    idCiudad: user.ciudadId,
    nombreCiudad: user.ciudad.nombreCiudad,
    idDepartamento: user.departamentoId,
    nombreDepartamento: user.departamento.nombreDepartamento,
    idRol: user.rolId,
    nombreRol: user.rol.nombreRol,
  }
}

