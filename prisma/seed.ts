import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main(){ console.log("Seed: (noop)"); }
main().finally(async()=> prisma.$disconnect());
