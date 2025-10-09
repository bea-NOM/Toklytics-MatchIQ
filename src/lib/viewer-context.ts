import { headers as nextHeaders } from 'next/headers'
import { Role as RoleEnum } from '@prisma/client'
import { getPrismaClient, MissingDatabaseUrlError, type PrismaClient } from './prisma'

type Role = (typeof RoleEnum)[keyof typeof RoleEnum]

type HeaderLike = Headers | ReturnType<typeof nextHeaders>

function prismaOrNull(): PrismaClient | null {
  try {
    return getPrismaClient()
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return null
    }
    throw error
  }
}

export type ViewerContext =
  | {
      role: typeof RoleEnum.CREATOR
      userId: string
      creatorId: string
      accessibleCreatorIds: string[]
    }
  | {
      role: typeof RoleEnum.AGENCY
      userId: string
      agencyId: string
      accessibleCreatorIds: string[]
    }
  | {
      role: typeof RoleEnum.ADMIN
      userId: string
      accessibleCreatorIds?: undefined
    }

async function resolveUserId(source?: HeaderLike): Promise<{ userId: string; roleHint?: Role } | null> {
  const headerStore = source ?? nextHeaders()
  const rawTikTokId =
    headerStore.get('x-tiktok-user-id') ??
    headerStore.get('x-tiktok-id') ??
    headerStore.get('x-tok-tiktok-id')

  if (!rawTikTokId) {
    return null
  }

  const tikTokId = rawTikTokId.trim()
  if (!tikTokId) {
    return null
  }

  const prisma = prismaOrNull()
  if (!prisma) {
    return null
  }

  const user = await prisma.users.findUnique({
    where: { tiktok_id: tikTokId },
    select: { id: true, role: true },
  })

  if (!user) {
    return null
  }

  return { userId: user.id, roleHint: user.role }
}

export async function getViewerContext(source?: HeaderLike): Promise<ViewerContext | null> {
  const resolved = await resolveUserId(source)
  if (!resolved) return null

  const prisma = prismaOrNull()
  if (!prisma) return null

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

  if (role === RoleEnum.CREATOR && user.creators) {
    return {
      role: RoleEnum.CREATOR,
      userId: user.id,
      creatorId: user.creators.id,
      accessibleCreatorIds: [user.creators.id],
    }
  }

  if (role === RoleEnum.AGENCY && user.agencies) {
    const creatorIds = user.agencies.memberships.map(m => m.creator_id)
    return {
      role: RoleEnum.AGENCY,
      userId: user.id,
      agencyId: user.agencies.id,
      accessibleCreatorIds: creatorIds,
    }
  }

  if (role === RoleEnum.ADMIN) {
    return {
      role: RoleEnum.ADMIN,
      userId: user.id,
    }
  }

  return null
}
