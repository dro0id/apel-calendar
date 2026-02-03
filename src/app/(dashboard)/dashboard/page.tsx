import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Users, ArrowRight, Copy, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CopyLinkButton } from "@/components/copy-link-button"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [user, eventTypes, upcomingBookings, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { username: true, name: true }
    }),
    prisma.eventType.findMany({
      where: { userId: session!.user.id, isActive: true },
      take: 3,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.booking.findMany({
      where: {
        userId: session!.user.id,
        startTime: { gte: new Date() },
        status: 'confirmed'
      },
      include: { eventType: true },
      take: 5,
      orderBy: { startTime: 'asc' }
    }),
    Promise.all([
      prisma.booking.count({
        where: { userId: session!.user.id, status: 'confirmed' }
      }),
      prisma.eventType.count({
        where: { userId: session!.user.id, isActive: true }
      }),
      prisma.booking.count({
        where: {
          userId: session!.user.id,
          startTime: { gte: new Date() },
          status: 'confirmed'
        }
      })
    ])
  ])

  const [totalBookings, totalEventTypes, upcomingCount] = stats
  const bookingLink = `${process.env.NEXTAUTH_URL}/${user?.username}`

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bienvenue, {user?.name} !</h1>
        <p className="text-muted-foreground mt-1">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* Quick link */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6">
          <div>
            <h3 className="font-semibold mb-1">Votre lien de réservation</h3>
            <p className="text-sm text-muted-foreground font-mono">
              {bookingLink}
            </p>
          </div>
          <div className="flex gap-2">
            <CopyLinkButton link={bookingLink} />
            <Link href={`/${user?.username}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total réservations
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Types d'événements
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEventTypes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              À venir
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Types d'événements</CardTitle>
              <CardDescription>Vos types de rendez-vous actifs</CardDescription>
            </div>
            <Link href="/event-types">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {eventTypes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Aucun type d'événement créé
                </p>
                <Link href="/event-types">
                  <Button>Créer un type d'événement</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {eventTypes.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.duration} minutes
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{event.slug}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Prochains rendez-vous</CardTitle>
              <CardDescription>Vos rendez-vous à venir</CardDescription>
            </div>
            <Link href="/bookings">
              <Button variant="ghost" size="sm">
                Voir tout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  Aucun rendez-vous à venir
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{booking.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.eventType.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(booking.startTime, "d MMM", { locale: fr })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(booking.startTime, "HH:mm")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
