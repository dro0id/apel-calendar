import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { BookingForm } from "@/components/booking-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Calendar } from "lucide-react"
import { getInitials } from "@/lib/utils"
import Link from "next/link"

interface BookingPageProps {
  params: { username: string; eventSlug: string }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const user = await prisma.user.findUnique({
    where: { username: params.username }
  })

  if (!user) {
    notFound()
  }

  const eventType = await prisma.eventType.findFirst({
    where: {
      userId: user.id,
      slug: params.eventSlug,
      isActive: true
    }
  })

  if (!eventType) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid lg:grid-cols-[350px_1fr] gap-8">
          {/* Sidebar - Event Info */}
          <div className="bg-white rounded-lg border p-6 h-fit">
            <Link href={`/${params.username}`} className="inline-block mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback>{getInitials(user.name || "U")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            </Link>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: eventType.color }}
                />
                <h1 className="text-xl font-bold">{eventType.title}</h1>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span>{eventType.duration} minutes</span>
              </div>

              {eventType.description && (
                <p className="text-sm text-muted-foreground">
                  {eventType.description}
                </p>
              )}
            </div>
          </div>

          {/* Main - Booking Form */}
          <div className="bg-white rounded-lg border p-6">
            <BookingForm
              username={params.username}
              eventSlug={params.eventSlug}
              eventTypeId={eventType.id}
              duration={eventType.duration}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <Calendar className="h-4 w-4" />
            Propulsé par Apel Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
