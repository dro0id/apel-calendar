"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, Clock, User, Mail, X, Loader2 } from "lucide-react"

interface Booking {
  id: string
  guestName: string
  guestEmail: string
  guestNotes: string | null
  guestTimezone: string
  startTime: Date
  endTime: Date
  status: string
  cancelReason: string | null
  eventType: {
    title: string
    color: string
    duration: number
  }
}

interface BookingsListProps {
  bookings: Booking[]
  showActions?: boolean
}

export function BookingsList({ bookings, showActions = false }: BookingsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    if (!cancellingId) return

    setLoading(true)
    try {
      const response = await fetch("/api/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cancellingId,
          status: "cancelled",
          cancelReason
        })
      })

      if (!response.ok) throw new Error()

      toast({ title: "Succès", description: "Rendez-vous annulé" })
      setCancelDialogOpen(false)
      setCancellingId(null)
      setCancelReason("")
      router.refresh()
    } catch {
      toast({ title: "Erreur", description: "Impossible d'annuler", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const openCancelDialog = (id: string) => {
    setCancellingId(id)
    setCancelDialogOpen(true)
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune réservation à afficher
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-2 h-full min-h-[60px] rounded-full"
                style={{ backgroundColor: booking.eventType.color }}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{booking.eventType.title}</h3>
                  {booking.status === 'cancelled' && (
                    <Badge variant="destructive">Annulé</Badge>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {booking.guestName}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {booking.guestEmail}
                  </div>
                </div>
                {booking.guestNotes && (
                  <p className="text-sm text-muted-foreground italic">
                    "{booking.guestNotes}"
                  </p>
                )}
                {booking.cancelReason && (
                  <p className="text-sm text-destructive">
                    Raison: {booking.cancelReason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-sm">
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(booking.startTime), "EEEE d MMMM yyyy", { locale: fr })}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                </div>
              </div>

              {showActions && booking.status === 'confirmed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCancelDialog(booking.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler le rendez-vous</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler ce rendez-vous ? L'invité sera notifié par email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Raison de l'annulation (optionnel)</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Indiquez la raison de l'annulation..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Retour
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
