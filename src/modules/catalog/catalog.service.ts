import { Prisma } from "../../generated/prisma"
import type { Rol, Departamento, Ciudad } from "../../generated/prisma"
import { prisma } from "../../config/prisma"
import { buildPage, type Page } from "../../utils/pagination"

type CiudadWithDepartamento = Ciudad & { departamento: Departamento }

export async function ensureDepartamento(nombre: string): Promise<Departamento> {
  const existing = await prisma.departamento.findFirst({
    where: { nombreDepartamento: { equals: nombre, mode: Prisma.QueryMode.insensitive } },
  })
  if (existing) return existing
  return prisma.departamento.create({
    data: { nombreDepartamento: nombre },
  })
}

export async function ensureRol(nombre: string): Promise<Rol> {
  const existing = await prisma.rol.findFirst({
    where: { nombreRol: { equals: nombre, mode: Prisma.QueryMode.insensitive } },
  })
  if (existing) return existing
  return prisma.rol.create({
    data: { nombreRol: nombre.toUpperCase() },
  })
}

export async function ensureCiudad(nombre: string, idDepartamento: string): Promise<CiudadWithDepartamento> {
  const existing = await prisma.ciudad.findFirst({
    where: {
      nombreCiudad: { equals: nombre, mode: Prisma.QueryMode.insensitive },
      departamentoId: idDepartamento,
    },
    include: { departamento: true },
  })
  if (existing) return existing
  return prisma.ciudad.create({
    data: { nombreCiudad: nombre, departamentoId: idDepartamento },
    include: { departamento: true },
  })
}

export async function listRoles(page: number, size: number): Promise<Page<Rol>> {
  const [items, total] = await prisma.$transaction([
    prisma.rol.findMany({
      skip: page * size,
      take: size,
      orderBy: { nombreRol: "asc" },
    }),
    prisma.rol.count(),
  ])
  return buildPage<Rol>(items, total, page, size)
}

export async function listDepartamentos(page: number, size: number): Promise<Page<Departamento>> {
  const [items, total] = await prisma.$transaction([
    prisma.departamento.findMany({
      skip: page * size,
      take: size,
      orderBy: { nombreDepartamento: "asc" },
    }),
    prisma.departamento.count(),
  ])
  return buildPage<Departamento>(items, total, page, size)
}

export async function listCiudadesByDepartamento(
  idDepartamento: string,
  page: number,
  size: number,
): Promise<Page<CiudadWithDepartamento>> {
  const [items, total] = await prisma.$transaction([
    prisma.ciudad.findMany({
      where: { departamentoId: idDepartamento },
      skip: page * size,
      take: size,
      orderBy: { nombreCiudad: "asc" },
      include: { departamento: true },
    }),
    prisma.ciudad.count({ where: { departamentoId: idDepartamento } }),
  ])
  return buildPage<CiudadWithDepartamento>(items, total, page, size)
}

export async function searchCiudades(q: string, page: number, size: number): Promise<Page<CiudadWithDepartamento>> {
  const where = q
    ? {
        nombreCiudad: { contains: q, mode: Prisma.QueryMode.insensitive },
      }
    : undefined

  const [items, total] = await prisma.$transaction([
    prisma.ciudad.findMany({
      where,
      skip: page * size,
      take: size,
      orderBy: { nombreCiudad: "asc" },
      include: { departamento: true },
    }),
    prisma.ciudad.count({ where }),
  ])
  return buildPage<CiudadWithDepartamento>(items, total, page, size)
}

