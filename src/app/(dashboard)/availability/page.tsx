import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AvailabilityEditor } from "@/components/availability-editor"

export default async function AvailabilityPage() {
  const session = await getServerSession(authOptions)

  const availability = await prisma.availability.findMany({
    where: { userId: session!.user.id },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  })

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { timezone: true }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Disponibilités</h1>
        <p className="text-muted-foreground mt-1">
          Définissez vos heures de disponibilité pour les réservations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horaires hebdomadaires</CardTitle>
          <CardDescription>
            Configurez vos créneaux disponibles pour chaque jour de la semaine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityEditor
            availability={availability}
            timezone={user?.timezone || 'Europe/Paris'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
