import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addDays, startOfDay, endOfDay, format, addMinutes, isBefore, isAfter, setHours, setMinutes } from "date-fns"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const eventSlug = searchParams.get('eventSlug')
  const dateStr = searchParams.get('date')

  if (!username || !eventSlug) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username }
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  // Find event type
  const eventType = await prisma.eventType.findFirst({
    where: {
      userId: user.id,
      slug: eventSlug,
      isActive: true
    }
  })

  if (!eventType) {
    return NextResponse.json({ error: "Type d'événement non trouvé" }, { status: 404 })
  }

  // Get availability
  const availability = await prisma.availability.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  })

  // If specific date requested, return slots for that date
  if (dateStr) {
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()

    // Get availability for this day
    const dayAvailability = availability.filter(a => a.dayOfWeek === dayOfWeek)

    if (dayAvailability.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing bookings for this day
    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: 'confirmed',
        startTime: {
          gte: startOfDay(date),
          lt: endOfDay(date)
        }
      }
    })

    // Generate slots
    const slots: { time: string; available: boolean }[] = []
    const now = new Date()
    const minimumNotice = addMinutes(now, eventType.minimumNotice)

    for (const avail of dayAvailability) {
      let currentTime = setMinutes(setHours(date, Math.floor(avail.startTime / 60)), avail.startTime % 60)
      const endTime = setMinutes(setHours(date, Math.floor(avail.endTime / 60)), avail.endTime % 60)

      while (isBefore(addMinutes(currentTime, eventType.duration), endTime) ||
             format(addMinutes(currentTime, eventType.duration), 'HH:mm') === format(endTime, 'HH:mm')) {
        const slotEnd = addMinutes(currentTime, eventType.duration)

        // Check if slot is in the past or within minimum notice
        if (isBefore(currentTime, minimumNotice)) {
          currentTime = addMinutes(currentTime, 15)
          continue
        }

        // Check for conflicts with existing bookings (including buffers)
        const slotStartWithBuffer = addMinutes(currentTime, -eventType.beforeBuffer)
        const slotEndWithBuffer = addMinutes(slotEnd, eventType.afterBuffer)

        const hasConflict = existingBookings.some(booking => {
          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          return (
            (isAfter(slotStartWithBuffer, bookingStart) && isBefore(slotStartWithBuffer, bookingEnd)) ||
            (isAfter(slotEndWithBuffer, bookingStart) && isBefore(slotEndWithBuffer, bookingEnd)) ||
            (isBefore(slotStartWithBuffer, bookingStart) && isAfter(slotEndWithBuffer, bookingEnd)) ||
            format(slotStartWithBuffer, 'HH:mm') === format(bookingStart, 'HH:mm')
          )
        })

        slots.push({
          time: format(currentTime, 'HH:mm'),
          available: !hasConflict
        })

        currentTime = addMinutes(currentTime, 15) // 15-minute increments
      }
    }

    return NextResponse.json({ slots: slots.filter(s => s.available) })
  }

  // Return available days for the next 60 days
  const availableDays: string[] = []
  const today = startOfDay(new Date())

  for (let i = 0; i < 60; i++) {
    const date = addDays(today, i)
    const dayOfWeek = date.getDay()

    // Check if there's availability for this day
    if (availability.some(a => a.dayOfWeek === dayOfWeek)) {
      availableDays.push(format(date, 'yyyy-MM-dd'))
    }
  }

  return NextResponse.json({
    availableDays,
    eventType: {
      id: eventType.id,
      title: eventType.title,
      description: eventType.description,
      duration: eventType.duration,
      color: eventType.color
    },
    user: {
      name: user.name,
      username: user.username,
      image: user.image
    }
  })
}
