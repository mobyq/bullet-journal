import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const collections = await prisma.collection.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { entries: true } } }
  })
  return NextResponse.json(collections)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, icon, color, description } = body
  const maxOrder = await prisma.collection.aggregate({ _max: { order: true } })
  const order = (maxOrder._max.order || 0) + 1
  const collection = await prisma.collection.create({
    data: { name, icon: icon || '📝', color: color || '#6B7280', description, order }
  })
  return NextResponse.json(collection)
}
