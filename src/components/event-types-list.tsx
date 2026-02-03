"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, Trash2, Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import { DURATIONS, EVENT_COLORS } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface EventType {
  id: string
  title: string
  slug: string
  description: string | null
  duration: number
  color: string
  isActive: boolean
}

interface EventTypesListProps {
  eventTypes: EventType[]
  username: string
}

export function EventTypesList({ eventTypes: initialEventTypes, username }: EventTypesListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [eventTypes, setEventTypes] = useState(initialEventTypes)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "30",
    color: "#3b82f6",
  })

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration: "30",
      color: "#3b82f6",
    })
  }

  const handleCreate = async () => {
    if (!formData.title) {
      toast({ title: "Erreur", description: "Le titre est requis", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/event-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const newEventType = await response.json()
      setEventTypes([newEventType, ...eventTypes])
      setIsCreateOpen(false)
      resetForm()
      toast({ title: "Succès", description: "Type d'événement créé" })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingEvent || !formData.title) return

    setLoading(true)
    try {
      const response = await fetch("/api/event-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEvent.id, ...formData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const updatedEventType = await response.json()
      setEventTypes(eventTypes.map(e => e.id === editingEvent.id ? updatedEventType : e))
      setIsEditOpen(false)
      setEditingEvent(null)
      resetForm()
      toast({ title: "Succès", description: "Type d'événement mis à jour" })
      router.refresh()
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (event: EventType) => {
    try {
      const response = await fetch("/api/event-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, isActive: !event.isActive }),
      })

      if (!response.ok) throw new Error()

      setEventTypes(eventTypes.map(e =>
        e.id === event.id ? { ...e, isActive: !e.isActive } : e
      ))
      router.refresh()
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier le statut", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce type d'événement ?")) return

    try {
      const response = await fetch(`/api/event-types?id=${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()

      setEventTypes(eventTypes.filter(e => e.id !== id))
      toast({ title: "Succès", description: "Type d'événement supprimé" })
      router.refresh()
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" })
    }
  }

  const copyLink = async (slug: string, id: string) => {
    const link = `${window.location.origin}/${username}/${slug}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const openEdit = (event: EventType) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || "",
      duration: event.duration.toString(),
      color: event.color,
    })
    setIsEditOpen(true)
  }

  return (
    <div className="space-y-4">
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button onClick={resetForm}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau type d'événement
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un type d'événement</DialogTitle>
            <DialogDescription>
              Définissez les paramètres de votre nouveau type de rendez-vous
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Réunion de 30 minutes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez ce type de rendez-vous..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le type d'événement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Durée</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData({ ...formData, duration: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value.toString()}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.value }} />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Annuler</Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {eventTypes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun type d'événement créé. Créez-en un pour commencer !
        </div>
      ) : (
        <div className="space-y-3">
          {eventTypes.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{event.title}</h3>
                    {!event.isActive && (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.duration} minutes • /{username}/{event.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={event.isActive}
                  onCheckedChange={() => handleToggleActive(event)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyLink(event.slug, event.id)}
                >
                  {copiedId === event.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a href={`/${username}/${event.slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(event)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
