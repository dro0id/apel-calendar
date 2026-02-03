import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const availability = await prisma.availability.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  })

  return NextResponse.json(availability)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { dayOfWeek, startTime, endTime } = body

    if (dayOfWeek === undefined || startTime === undefined || endTime === undefined) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    if (startTime >= endTime) {
      return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début" }, { status: 400 })
    }

    const availability = await prisma.availability.create({
      data: {
        userId: session.user.id,
        dayOfWeek: parseInt(dayOfWeek),
        startTime: parseInt(startTime),
        endTime: parseInt(endTime),
      }
    })

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error creating availability:", error)
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
    const { schedules } = body

    // Delete all existing availability
    await prisma.availability.deleteMany({
      where: { userId: session.user.id }
    })

    // Create new availability
    if (schedules && schedules.length > 0) {
      await prisma.availability.createMany({
        data: schedules.map((s: { dayOfWeek: number, startTime: number, endTime: number }) => ({
          userId: session.user.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        }))
      })
    }

    const availability = await prisma.availability.findMany({
      where: { userId: session.user.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    })

    return NextResponse.json(availability)
  } catch (error) {
    console.error("Error updating availability:", error)
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

    const existingAvailability = await prisma.availability.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingAvailability) {
      return NextResponse.json({ error: "Disponibilité non trouvée" }, { status: 404 })
    }

    await prisma.availability.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting availability:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
