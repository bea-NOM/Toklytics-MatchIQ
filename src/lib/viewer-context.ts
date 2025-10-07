import { headers as nextHeaders } from 'next/headers'
import { Role } from '@prisma/client'
import { prisma } from './prisma'

type HeaderLike = Headers | ReturnType<typeof nextHeaders>

export type ViewerContext =
  | {
      role: Role.CREATOR
      userId: string
      creatorId: string
      accessibleCreatorIds: string[]
    }
  | {
      role: Role.AGENCY
      userId: string
      agencyId: string
      accessibleCreatorIds: string[]
    }
  | {
      role: Role.ADMIN
      userId: string
      accessibleCreatorIds?: undefined
    }

async function resolveUserId(source?: HeaderLike): Promise<{ userId: string; roleHint?: Role } | null> {
  const headerStore = source ?? nextHeaders()
  const headerUserId = headerStore.get('x-tok-user-id')
  const headerRole = headerStore.get('x-tok-role') as Role | null

  if (headerUserId) {
    return { userId: headerUserId, roleHint: headerRole ?? undefined }
  }

  const fallbackUserId = process.env.DEMO_USER_ID
  if (fallbackUserId) {
    return { userId: fallbackUserId as string, roleHint: headerRole ?? undefined }
  }

  const demoCreatorId = process.env.DEMO_CREATOR_ID
  if (demoCreatorId) {
    const creator = await prisma.creators.findUnique({
      where: { id: demoCreatorId },
      include: { user: true },
    })
    if (creator?.user) {
      return { userId: creator.user.id, roleHint: Role.CREATOR }
    }
  }

  const demoAgencyId = process.env.DEMO_AGENCY_ID
  if (demoAgencyId) {
    const agency = await prisma.agencies.findUnique({
      where: { id: demoAgencyId },
      include: { user: true },
    })
    if (agency?.user) {
      return { userId: agency.user.id, roleHint: Role.AGENCY }
    }
  }

  const creator = await prisma.creators.findFirst({
    include: { user: true },
  })
  if (creator?.user) {
    return { userId: creator.user.id, roleHint: Role.CREATOR }
  }

  return null
}

export async function getViewerContext(source?: HeaderLike): Promise<ViewerContext | null> {
  const resolved = await resolveUserId(source)
  if (!resolved) return null

  const user = await prisma.users.findUnique({
    where: { id: resolved.userId },
    include: {
      creators: true,
      agencies: {
        include: {
          memberships: {
            where: { active: true },
            select: { creator_id: true },
          },
        },
      },
    },
  })

  if (!user) return null
  const role = resolved.roleHint ?? user.role

  if (role === Role.CREATOR && user.creators) {
    return {
      role: Role.CREATOR,
      userId: user.id,
      creatorId: user.creators.id,
      accessibleCreatorIds: [user.creators.id],
    }
  }

  if (role === Role.AGENCY && user.agencies) {
    const creatorIds = user.agencies.memberships.map(m => m.creator_id)
    return {
      role: Role.AGENCY,
      userId: user.id,
      agencyId: user.agencies.id,
      accessibleCreatorIds: creatorIds,
    }
  }

  if (role === Role.ADMIN) {
    return {
      role: Role.ADMIN,
      userId: user.id,
    }
  }

  return null
}
