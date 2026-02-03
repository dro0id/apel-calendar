import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateSlug } from "@/lib/utils"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const eventTypes = await prisma.eventType.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(eventTypes)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, duration, color, requiresConfirmation, beforeBuffer, afterBuffer, minimumNotice } = body

    if (!title || !duration) {
      return NextResponse.json({ error: "Titre et durée requis" }, { status: 400 })
    }

    // Generate unique slug
    let slug = generateSlug(title)
    let counter = 1
    while (await prisma.eventType.findUnique({
      where: { userId_slug: { userId: session.user.id, slug } }
    })) {
      slug = `${generateSlug(title)}-${counter}`
      counter++
    }

    const eventType = await prisma.eventType.create({
      data: {
        userId: session.user.id,
        title,
        slug,
        description: description || null,
        duration: parseInt(duration),
        color: color || "#3b82f6",
        requiresConfirmation: requiresConfirmation || false,
        beforeBuffer: beforeBuffer || 0,
        afterBuffer: afterBuffer || 0,
        minimumNotice: minimumNotice || 60,
      }
    })

    return NextResponse.json(eventType)
  } catch (error) {
    console.error("Error creating event type:", error)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, description, duration, color, isActive, requiresConfirmation, beforeBuffer, afterBuffer, minimumNotice } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const existingEventType = await prisma.eventType.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingEventType) {
      return NextResponse.json({ error: "Type d'événement non trouvé" }, { status: 404 })
    }

    const eventType = await prisma.eventType.update({
      where: { id },
      data: {
        title: title || existingEventType.title,
        description: description !== undefined ? description : existingEventType.description,
        duration: duration ? parseInt(duration) : existingEventType.duration,
        color: color || existingEventType.color,
        isActive: isActive !== undefined ? isActive : existingEventType.isActive,
        requiresConfirmation: requiresConfirmation !== undefined ? requiresConfirmation : existingEventType.requiresConfirmation,
        beforeBuffer: beforeBuffer !== undefined ? beforeBuffer : existingEventType.beforeBuffer,
        afterBuffer: afterBuffer !== undefined ? afterBuffer : existingEventType.afterBuffer,
        minimumNotice: minimumNotice !== undefined ? minimumNotice : existingEventType.minimumNotice,
      }
    })

    return NextResponse.json(eventType)
  } catch (error) {
    console.error("Error updating event type:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const existingEventType = await prisma.eventType.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingEventType) {
      return NextResponse.json({ error: "Type d'événement non trouvé" }, { status: 404 })
    }

    await prisma.eventType.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event type:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
