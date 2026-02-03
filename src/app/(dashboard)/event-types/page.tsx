import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EventTypesList } from "@/components/event-types-list"

export default async function EventTypesPage() {
  const session = await getServerSession(authOptions)

  const eventTypes = await prisma.eventType.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' }
  })

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { username: true }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Types d'événements</h1>
        <p className="text-muted-foreground mt-1">
          Créez et gérez vos différents types de rendez-vous
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vos types d'événements</CardTitle>
          <CardDescription>
            Chaque type d'événement a son propre lien de réservation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventTypesList eventTypes={eventTypes} username={user?.username || ''} />
        </CardContent>
      </Card>
    </div>
  )
}
