import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendBookingConfirmation, sendCancellationEmail } from "@/lib/email"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const upcoming = searchParams.get('upcoming')

  const where: Record<string, unknown> = { userId: session.user.id }

  if (status) {
    where.status = status
  }

  if (upcoming === 'true') {
    where.startTime = { gte: new Date() }
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: { eventType: true },
    orderBy: { startTime: 'asc' }
  })

  return NextResponse.json(bookings)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { eventTypeId, guestName, guestEmail, guestNotes, guestTimezone, startTime, endTime } = body

    if (!eventTypeId || !guestName || !guestEmail || !startTime || !endTime) {
      return NextResponse.json({ error: "Tous les champs obligatoires sont requis" }, { status: 400 })
    }

    const eventType = await prisma.eventType.findUnique({
      where: { id: eventTypeId },
      include: { user: true }
    })

    if (!eventType) {
      return NextResponse.json({ error: "Type d'événement non trouvé" }, { status: 404 })
    }

    // Check for conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        userId: eventType.userId,
        status: 'confirmed',
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } }
            ]
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } }
            ]
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } }
            ]
          }
        ]
      }
    })

    if (conflict) {
      return NextResponse.json({ error: "Ce créneau n'est plus disponible" }, { status: 409 })
    }

    const booking = await prisma.booking.create({
      data: {
        eventTypeId,
        userId: eventType.userId,
        guestName,
        guestEmail,
        guestNotes: guestNotes || null,
        guestTimezone: guestTimezone || 'Europe/Paris',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: eventType.requiresConfirmation ? 'pending' : 'confirmed',
      },
      include: { eventType: true }
    })

    // Send email notifications
    try {
      await sendBookingConfirmation({
        guestName,
        guestEmail,
        hostName: eventType.user.name || 'Hôte',
        hostEmail: eventType.user.email,
        eventTitle: eventType.title,
        startTime: booking.startTime,
        endTime: booking.endTime,
        guestTimezone: guestTimezone || 'Europe/Paris',
      })
    } catch (emailError) {
      console.error("Error sending email:", emailError)
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error creating booking:", error)
    return NextResponse.json({ error: "Erreur lors de la réservation" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, status, cancelReason } = body

    if (!id || !status) {
      return NextResponse.json({ error: "ID et statut requis" }, { status: 400 })
    }

    const existingBooking = await prisma.booking.findFirst({
      where: { id, userId: session.user.id },
      include: { eventType: { include: { user: true } } }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 })
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        cancelReason: cancelReason || null,
      },
      include: { eventType: true }
    })

    // Send cancellation email if cancelled
    if (status === 'cancelled') {
      try {
        await sendCancellationEmail({
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          hostName: existingBooking.eventType.user.name || 'Hôte',
          hostEmail: existingBooking.eventType.user.email,
          eventTitle: booking.eventType.title,
          startTime: booking.startTime,
          endTime: booking.endTime,
          guestTimezone: booking.guestTimezone,
          cancelReason,
        })
      } catch (emailError) {
        console.error("Error sending cancellation email:", emailError)
      }
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}
