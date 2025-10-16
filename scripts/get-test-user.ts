import { getPrismaClient } from '../src/lib/prisma'

async function getTestUser() {
  const prisma = getPrismaClient()
  const users = await prisma.users.findMany({
    take: 5,
    select: { id: true, role: true, tiktok_id: true, handle: true },
    orderBy: { created_at: 'desc' }
  })
  
  console.log('Available test users:')
  console.log(JSON.stringify(users, null, 2))
  
  if (users.length === 0) {
    console.log('\nNo users found. Creating a test user...')
    const newUser = await prisma.users.create({
      data: {
        tiktok_id: 'test_' + Date.now(),
        email: 'test@example.com',
        handle: '@testcreator',
        role: 'CREATOR',
      },
      select: { id: true, role: true, tiktok_id: true, handle: true }
    })
    console.log('\nCreated test user:')
    console.log(JSON.stringify(newUser, null, 2))
  }
}

getTestUser().catch(console.error).finally(() => process.exit())
