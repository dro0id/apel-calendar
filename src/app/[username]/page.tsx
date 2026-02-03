import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock } from "lucide-react"
import { getInitials } from "@/lib/utils"

interface UserPageProps {
  params: { username: string }
}

export default async function UserPage({ params }: UserPageProps) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      eventTypes: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* User Profile */}
        <div className="text-center mb-8">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback className="text-2xl">
              {getInitials(user.name || "U")}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>

        {/* Event Types */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-center text-muted-foreground">
            Choisissez un type de rendez-vous
          </h2>

          {user.eventTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun type de rendez-vous disponible pour le moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {user.eventTypes.map((event) => (
                <Link key={event.id} href={`/${user.username}/${event.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Clock className="h-4 w-4" />
                            {event.duration} minutes
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {event.description && (
                      <CardContent className="pt-0">
                        <CardDescription>{event.description}</CardDescription>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Calendar className="h-4 w-4" />
            Propulsé par Apel Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
