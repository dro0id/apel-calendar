"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, addMinutes, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, CalendarDays, Clock, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingFormProps {
  username: string
  eventSlug: string
  eventTypeId: string
  duration: number
}

type Step = "date" | "time" | "form" | "success"

export function BookingForm({ username, eventSlug, eventTypeId, duration }: BookingFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>("date")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: "",
  })

  // Load available days
  useEffect(() => {
    const loadAvailableDays = async () => {
      try {
        const response = await fetch(
          `/api/public/slots?username=${username}&eventSlug=${eventSlug}`
        )
        if (response.ok) {
          const data = await response.json()
          setAvailableDays(data.availableDays)
        }
      } catch (error) {
        console.error("Error loading available days:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAvailableDays()
  }, [username, eventSlug])

  // Load slots when date is selected
  useEffect(() => {
    if (!selectedDate) return

    const loadSlots = async () => {
      setSlotsLoading(true)
      try {
        const dateStr = format(selectedDate, "yyyy-MM-dd")
        const response = await fetch(
          `/api/public/slots?username=${username}&eventSlug=${eventSlug}&date=${dateStr}`
        )
        if (response.ok) {
          const data = await response.json()
          setAvailableSlots(data.slots)
        }
      } catch (error) {
        console.error("Error loading slots:", error)
      } finally {
        setSlotsLoading(false)
      }
    }

    loadSlots()
  }, [selectedDate, username, eventSlug])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setSelectedTime(null)
    if (date) {
      setStep("time")
    }
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep("form")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDate || !selectedTime || !formData.name || !formData.email) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" })
      return
    }

    setSubmitting(true)

    const [hours, minutes] = selectedTime.split(":").map(Number)
    const startTime = new Date(selectedDate)
    startTime.setHours(hours, minutes, 0, 0)
    const endTime = addMinutes(startTime, duration)

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId,
          guestName: formData.name,
          guestEmail: formData.email,
          guestNotes: formData.notes || null,
          guestTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la réservation")
      }

      setStep("success")
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de réserver",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    return availableDays.includes(dateStr)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (step === "success") {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Réservation confirmée !</h2>
        <p className="text-muted-foreground mb-6">
          Vous recevrez un email de confirmation à {formData.email}
        </p>
        <Card className="max-w-sm mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>{format(selectedDate!, "EEEE d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTime} - {format(addMinutes(new Date(`2000-01-01T${selectedTime}`), duration), "HH:mm")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {step !== "date" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(step === "form" ? "time" : "date")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        )}
        <div className="flex-1">
          <h2 className="font-semibold">
            {step === "date" && "Sélectionnez une date"}
            {step === "time" && "Sélectionnez un horaire"}
            {step === "form" && "Vos informations"}
          </h2>
          {selectedDate && step !== "date" && (
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              {selectedTime && ` à ${selectedTime}`}
            </p>
          )}
        </div>
      </div>

      {/* Date selection */}
      {step === "date" && (
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => !isDateAvailable(date) || date < new Date()}
            className="rounded-md border"
          />
        </div>
      )}

      {/* Time selection */}
      {step === "time" && (
        <div>
          {slotsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun créneau disponible pour cette date
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedTime === slot.time ? "default" : "outline"}
                  className={cn(
                    "h-12",
                    selectedTime === slot.time && "ring-2 ring-primary"
                  )}
                  onClick={() => handleTimeSelect(slot.time)}
                >
                  {slot.time}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form */}
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jean@exemple.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informations supplémentaires pour ce rendez-vous..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmer la réservation
          </Button>
        </form>
      )}
    </div>
  )
}
