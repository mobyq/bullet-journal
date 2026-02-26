import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const collectionId = searchParams.get('collectionId')
  const date = searchParams.get('date')
  
  const where: any = {}
  if (collectionId) where.collectionId = collectionId
  if (date) {
    const targetDate = new Date(date)
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)
    where.date = { gte: targetDate, lt: nextDay }
  }

  const entries = await prisma.bulletEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { collection: true }
  })
  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { content, type, status, date, collectionId } = body
  const entry = await prisma.bulletEntry.create({
    data: {
      content,
      type: type || 'note',
      status: status || 'pending',
      date: date ? new Date(date) : new Date(),
      collectionId
    },
    include: { collection: true }
  })
  return NextResponse.json(entry)
}
