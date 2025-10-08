// prisma.config.js
try {
  require('dotenv/config')
} catch (error) {
  if (!error.message || !error.message.includes('dotenv')) {
    throw error
  }
  // The Prisma language server runs without our dev deps, so skip dotenv silently.
}
const { defineConfig } = require('@prisma/config')

module.exports = defineConfig({
  // In JS you can safely use plain strings
  schema: './prisma/schema.prisma',
  migrations: './prisma/migrations',

  // Seed supports a function
  async seed() {
    // Try TS first; fall back to JS if you switch later
    try {
      await import('./prisma/seed.ts')
    } catch {
      await import('./prisma/seed.js')
    }
  },
})
