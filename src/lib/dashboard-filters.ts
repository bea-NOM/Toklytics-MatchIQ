export type DashboardSearchParams = Record<string, string | string[] | undefined> | undefined

export type DashboardRawFilters = {
  creator: string
  supporter: string
  type: string
  expiresAfter: string
  expiresBefore: string
}

export type DashboardParsedFilters = {
  creatorFilter?: string
  supporterFilter?: string
  typeFilter?: string
  expiresAfter?: Date
  expiresBefore?: Date
}

export type DashboardFilterState = {
  rawFilters: DashboardRawFilters
  normalizedTypeFilter: string
  parsedFilters: DashboardParsedFilters
}

function coerceString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? ''
  }
  return value ?? ''
}

function safeParseDate(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }
  return parsed
}

export function deriveDashboardFilters(
  searchParams: DashboardSearchParams,
  proEnabled: boolean,
): DashboardFilterState {
  const readParam = (key: string) => coerceString(searchParams?.[key])

  const rawFilters: DashboardRawFilters = {
    creator: readParam('creator').trim(),
    supporter: readParam('supporter').trim(),
    type: readParam('type').trim(),
    expiresAfter: readParam('expiresAfter').trim(),
    expiresBefore: readParam('expiresBefore').trim(),
  }

  const normalizedTypeFilter = rawFilters.type ? rawFilters.type.toUpperCase() : ''

  if (!proEnabled) {
    return {
      rawFilters,
      normalizedTypeFilter,
      parsedFilters: {},
    }
  }

  const parsedFilters: DashboardParsedFilters = {
    creatorFilter: rawFilters.creator || undefined,
    supporterFilter: rawFilters.supporter || undefined,
    typeFilter: normalizedTypeFilter || undefined,
    expiresAfter: safeParseDate(rawFilters.expiresAfter),
    expiresBefore: safeParseDate(rawFilters.expiresBefore),
  }

  return {
    rawFilters,
    normalizedTypeFilter,
    parsedFilters,
  }
}
