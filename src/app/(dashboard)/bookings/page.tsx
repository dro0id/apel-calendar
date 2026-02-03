import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingsList } from "@/components/bookings-list"

export default async function BookingsPage() {
  const session = await getServerSession(authOptions)

  const [upcomingBookings, pastBookings, cancelledBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: session!.user.id,
        startTime: { gte: new Date() },
        status: 'confirmed'
      },
      include: { eventType: true },
      orderBy: { startTime: 'asc' }
    }),
    prisma.booking.findMany({
      where: {
        userId: session!.user.id,
        startTime: { lt: new Date() },
        status: 'confirmed'
      },
      include: { eventType: true },
      orderBy: { startTime: 'desc' },
      take: 20
    }),
    prisma.booking.findMany({
      where: {
        userId: session!.user.id,
        status: 'cancelled'
      },
      include: { eventType: true },
      orderBy: { updatedAt: 'desc' },
      take: 20
    })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Réservations</h1>
        <p className="text-muted-foreground mt-1">
          Gérez tous vos rendez-vous
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos rendez-vous</CardTitle>
          <CardDescription>
            Consultez et gérez vos réservations passées et à venir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                À venir ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Passés ({pastBookings.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Annulés ({cancelledBookings.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              <BookingsList bookings={upcomingBookings} showActions />
            </TabsContent>
            <TabsContent value="past" className="mt-4">
              <BookingsList bookings={pastBookings} />
            </TabsContent>
            <TabsContent value="cancelled" className="mt-4">
              <BookingsList bookings={cancelledBookings} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
