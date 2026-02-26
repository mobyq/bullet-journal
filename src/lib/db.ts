import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

let dbInitialized = false

export async function ensureDbInitialized() {
  if (dbInitialized) return
  
  try {
    await prisma.collection.findFirst()
    dbInitialized = true
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('Creating database tables...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Collection (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          description TEXT,
          "order" INTEGER DEFAULT 0,
          "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS BulletEntry (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          date DATETIME DEFAULT CURRENT_TIMESTAMP,
          "collectionId" TEXT NOT NULL,
          "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY ("collectionId") REFERENCES Collection(id) ON DELETE CASCADE
        );
        
        CREATE INDEX IF NOT EXISTS "BulletEntry_collectionId_idx" ON BulletEntry("collectionId");
        CREATE INDEX IF NOT EXISTS "BulletEntry_date_idx" ON BulletEntry(date);
      `)
      console.log('Database tables created successfully')
      dbInitialized = true
    }
  }
}

// 在模块加载时初始化
ensureDbInitialized()

export default prisma
