// prisma.config.js
require('dotenv/config')
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
