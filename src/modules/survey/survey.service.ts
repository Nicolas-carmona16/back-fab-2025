import { prisma } from "../../config/prisma"
import { buildPage, type Page } from "../../utils/pagination"
import type { Survey, User } from "../../generated/prisma"

export interface SurveyInput {
  rating: number
  comment?: string
  status: "pending" | "submitted" | "skipped"
}

export async function submitSurvey(userId: string, input: SurveyInput): Promise<Survey> {
  if (input.rating < 1 || input.rating > 5) {
    throw new Error("La calificación debe estar entre 1 y 5")
  }
  const status = input.status.toUpperCase()
  if (!["PENDING", "SUBMITTED", "SKIPPED"].includes(status)) {
    throw new Error("Estado de encuesta inválido")
  }
  return prisma.survey.create({
    data: {
      userId,
      rating: input.rating,
      comment: input.comment,
      status: status as "SUBMITTED" | "SKIPPED" | "PENDING",
    },
  })
}

export async function listSurveys(page: number, size: number): Promise<Page<Survey & { user: User }>> {
  const [items, total] = await prisma.$transaction([
    prisma.survey.findMany({
      skip: page * size,
      take: size,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    }),
    prisma.survey.count(),
  ])
  return buildPage(items, total, page, size)
}

