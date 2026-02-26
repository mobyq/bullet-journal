import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { content, type, status, date, collectionId } = body
  const entry = await prisma.bulletEntry.update({
    where: { id },
    data: {
      ...(content !== undefined && { content }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(collectionId !== undefined && { collectionId })
    },
    include: { collection: true }
  })
  return NextResponse.json(entry)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.bulletEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
