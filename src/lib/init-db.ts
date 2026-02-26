import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function initDatabase() {
  try {
    // 尝试查询，如果失败则创建表
    await prisma.collection.findFirst()
    console.log('Database already initialized')
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('Initializing database...')
      // 使用 Prisma 的 executeRaw 创建表
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
      console.log('Database initialized successfully')
    } else {
      throw error
    }
  }
}

initDatabase().catch(console.error)

export default prisma
