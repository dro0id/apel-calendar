# Apel Calendar

Un clone de Calendly gratuit et open-source pour la prise de rendez-vous en ligne.

## Fonctionnalités

- **Authentification complète** - Inscription, connexion, gestion de session
- **Types d'événements** - Créez différents types de rendez-vous (30min, 1h, etc.)
- **Disponibilités flexibles** - Définissez vos heures de travail par jour
- **Page de réservation publique** - Lien personnalisé partageable
- **Calendrier interactif** - Sélection de date et d'heure intuitive
- **Notifications email** - Confirmations automatiques (optionnel)
- **Interface en français** - Entièrement localisé

## Technologies

- **Framework**: Next.js 14 (App Router)
- **Base de données**: SQLite avec Prisma
- **Authentification**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **Langage**: TypeScript

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

1. **Cloner le repo**
   ```bash
   git clone <url>
   cd apel-calendar
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env
   ```

   Éditez `.env` et configurez:
   - `NEXTAUTH_SECRET`: Une clé secrète pour NextAuth
   - `NEXTAUTH_URL`: L'URL de votre application (http://localhost:3000 en dev)
   - (Optionnel) Les paramètres SMTP pour les emails

4. **Initialiser la base de données**
   ```bash
   npm run db:push
   ```

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

6. **Ouvrir l'application**

   Rendez-vous sur [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
src/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/            # Pages d'authentification
│   ├── (dashboard)/       # Pages du tableau de bord
│   ├── [username]/        # Pages publiques de réservation
│   └── api/               # API Routes
├── components/            # Composants React
│   └── ui/               # Composants UI (shadcn)
├── lib/                   # Utilitaires et configuration
└── types/                 # Types TypeScript
```

## Utilisation

### Créer un compte

1. Rendez-vous sur `/register`
2. Créez votre compte avec email et mot de passe
3. Un type d'événement par défaut et des disponibilités sont créés automatiquement

### Configurer vos disponibilités

1. Allez dans "Disponibilités"
2. Activez/désactivez les jours
3. Définissez vos créneaux horaires
4. Enregistrez

### Créer des types d'événements

1. Allez dans "Types d'événements"
2. Cliquez sur "Nouveau type d'événement"
3. Configurez le titre, la durée et la couleur
4. Partagez le lien généré

### Recevoir des réservations

1. Partagez votre lien: `votresite.com/votre-username`
2. Les invités choisissent un type d'événement
3. Ils sélectionnent une date et un créneau
4. Ils confirment avec leurs informations
5. Vous et l'invité recevez une confirmation

## Déploiement

### Vercel (recommandé)

1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement
3. Déployez !

### Autres plateformes

L'application peut être déployée sur n'importe quelle plateforme supportant Node.js.

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

MIT
