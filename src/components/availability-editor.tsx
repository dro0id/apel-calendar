"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { DAYS_OF_WEEK, formatTime, parseTime } from "@/lib/utils"
import { Plus, Trash2, Loader2, Save } from "lucide-react"

interface Availability {
  id: string
  dayOfWeek: number
  startTime: number
  endTime: number
  isActive: boolean
}

interface AvailabilityEditorProps {
  availability: Availability[]
  timezone: string
}

interface DaySchedule {
  enabled: boolean
  slots: { startTime: number; endTime: number }[]
}

export function AvailabilityEditor({ availability, timezone }: AvailabilityEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Initialize schedule from availability
  const initSchedule = () => {
    const schedule: Record<number, DaySchedule> = {}
    for (let i = 0; i < 7; i++) {
      const daySlots = availability.filter(a => a.dayOfWeek === i)
      schedule[i] = {
        enabled: daySlots.length > 0,
        slots: daySlots.length > 0
          ? daySlots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
          : [{ startTime: 540, endTime: 1020 }] // Default 9:00 - 17:00
      }
    }
    return schedule
  }

  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(initSchedule)

  const toggleDay = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }))
  }

  const updateSlot = (day: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    const minutes = parseTime(value)
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === index ? { ...slot, [field]: minutes } : slot
        )
      }
    }))
  }

  const addSlot = (day: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { startTime: 840, endTime: 1020 }] // 14:00 - 17:00
      }
    }))
  }

  const removeSlot = (day: number, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index)
      }
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const schedules: { dayOfWeek: number; startTime: number; endTime: number }[] = []

      Object.entries(schedule).forEach(([day, daySchedule]) => {
        if (daySchedule.enabled) {
          daySchedule.slots.forEach(slot => {
            if (slot.startTime < slot.endTime) {
              schedules.push({
                dayOfWeek: parseInt(day),
                startTime: slot.startTime,
                endTime: slot.endTime
              })
            }
          })
        }
      })

      const response = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedules })
      })

      if (!response.ok) throw new Error()

      toast({ title: "Succès", description: "Disponibilités mises à jour" })
      router.refresh()
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Fuseau horaire: {timezone}
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day.value}
            className="flex items-start gap-4 p-4 rounded-lg border"
          >
            <div className="flex items-center gap-3 w-32 pt-2">
              <Switch
                checked={schedule[day.value]?.enabled}
                onCheckedChange={() => toggleDay(day.value)}
              />
              <span className={!schedule[day.value]?.enabled ? "text-muted-foreground" : ""}>
                {day.label}
              </span>
            </div>

            {schedule[day.value]?.enabled ? (
              <div className="flex-1 space-y-2">
                {schedule[day.value].slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formatTime(slot.startTime)}
                      onChange={(e) => updateSlot(day.value, index, 'startTime', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={formatTime(slot.endTime)}
                      onChange={(e) => updateSlot(day.value, index, 'endTime', e.target.value)}
                      className="w-32"
                    />
                    {schedule[day.value].slots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSlot(day.value, index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSlot(day.value)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter un créneau
                </Button>
              </div>
            ) : (
              <div className="flex-1 pt-2 text-muted-foreground">
                Indisponible
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Enregistrer les modifications
      </Button>
    </div>
  )
}
