export interface PageInfo {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Page<T> {
  content: T[]
  pageInfo: PageInfo
}

export function buildPage<T>(items: T[], total: number, page: number, size: number): Page<T> {
  const totalPages = size === 0 ? 0 : Math.ceil(total / size)
  return {
    content: items,
    pageInfo: {
      page,
      size,
      totalElements: total,
      totalPages,
    },
  }
}

