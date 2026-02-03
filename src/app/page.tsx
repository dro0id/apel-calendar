import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Link as LinkIcon, CheckCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Apel Calendar</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button>Commencer gratuitement</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Simplifiez la prise de{" "}
            <span className="text-primary">rendez-vous</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Partagez votre lien, laissez vos invités choisir un créneau disponible,
            et recevez des notifications automatiques. Simple, rapide et gratuit.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Créer mon calendrier
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-24">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <LinkIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lien personnalisé</h3>
            <p className="text-muted-foreground">
              Partagez votre lien unique pour permettre aux autres de réserver
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
              <Clock className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Disponibilités flexibles</h3>
            <p className="text-muted-foreground">
              Définissez vos heures de disponibilité selon vos préférences
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/10 mb-4">
              <Users className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Types d'événements</h3>
            <p className="text-muted-foreground">
              Créez différents types de rendez-vous avec des durées variées
            </p>
          </div>

          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/10 mb-4">
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Confirmations auto</h3>
            <p className="text-muted-foreground">
              Notifications par email automatiques pour vous et vos invités
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                1
              </div>
              <div className="pl-8">
                <h3 className="text-lg font-semibold mb-2">Créez votre compte</h3>
                <p className="text-muted-foreground">
                  Inscrivez-vous gratuitement et configurez vos disponibilités
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                2
              </div>
              <div className="pl-8">
                <h3 className="text-lg font-semibold mb-2">Partagez votre lien</h3>
                <p className="text-muted-foreground">
                  Envoyez votre lien personnalisé à vos contacts
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                3
              </div>
              <div className="pl-8">
                <h3 className="text-lg font-semibold mb-2">Recevez des réservations</h3>
                <p className="text-muted-foreground">
                  Vos invités choisissent un créneau et vous êtes notifié
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 mt-12 border-t">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="font-semibold">Apel Calendar</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Apel Calendar. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  )
}
