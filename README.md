# Apel Calendar

Clone de Calendly complet, construit avec Streamlit et Supabase.

## Fonctionnalités

### Page publique (visiteurs)
- Liste des types de rendez-vous disponibles
- Calendrier interactif pour choisir une date
- Sélection de créneaux horaires
- Formulaire de réservation (nom, email, téléphone, notes)
- Confirmation instantanée

### Administration (protégée par mot de passe)
- **Dashboard** : Statistiques et prochains rendez-vous
- **Types d'événements** : Créer, modifier, supprimer des types de RDV
- **Disponibilités** : Configurer les horaires par jour + exceptions
- **Réservations** : Voir, filtrer, annuler, exporter en CSV
- **Paramètres** : Nom entreprise, message d'accueil, mot de passe

### Fonctionnalités avancées
- Durées personnalisables (15, 30, 45, 60, 90, 120 min)
- Couleurs pour chaque type d'événement
- Buffer avant/après les rendez-vous
- Préavis minimum configurable
- Exceptions de dates (jours fériés, vacances)
- Token d'annulation unique par réservation

## Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet (gratuit)
3. Attendez l'initialisation

### 2. Créer les tables

1. Dashboard Supabase → **SQL Editor**
2. Copiez le contenu de `supabase_schema.sql`
3. Exécutez le script

### 3. Récupérer vos clés

1. **Settings** → **API**
2. Copiez :
   - `Project URL`
   - `anon public key`

## Installation locale

```bash
# Cloner le repo
git clone https://github.com/dro0id/apel-calendar.git
cd apel-calendar

# Installer les dépendances
pip install -r requirements.txt

# Configurer les secrets
cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# Éditez secrets.toml avec vos clés Supabase

# Lancer l'application
streamlit run app.py
```

Accédez à `http://localhost:8501`

## Déploiement sur Streamlit Cloud

1. [share.streamlit.io](https://share.streamlit.io) → **New app**
2. Sélectionnez le repo et la branche `main`
3. Main file: `app.py`
4. **Advanced settings** → **Secrets** :
   ```toml
   SUPABASE_URL = "https://xxx.supabase.co"
   SUPABASE_KEY = "votre-anon-key"
   ```
5. **Deploy**

## Structure

```
apel-calendar/
├── app.py                      # Page publique de réservation
├── pages/
│   ├── 1_📊_Dashboard.py       # Dashboard admin
│   ├── 2_🎯_Types_Evenements.py # Gestion des événements
│   ├── 3_🕐_Disponibilites.py   # Gestion des horaires
│   ├── 4_📋_Reservations.py     # Liste des réservations
│   └── 5_⚙️_Parametres.py       # Paramètres
├── utils/
│   ├── database.py             # Fonctions Supabase
│   └── auth.py                 # Authentification admin
├── requirements.txt
├── supabase_schema.sql
└── .streamlit/
    ├── config.toml
    └── secrets.toml.example
```

## Connexion admin

**Mot de passe par défaut :** `admin123`

Changez-le immédiatement dans **Paramètres** → **Sécurité** !

## Tables Supabase

| Table | Description |
|-------|-------------|
| `settings` | Paramètres globaux (nom, email, mot de passe) |
| `event_types` | Types d'événements (durée, couleur, options) |
| `availability` | Disponibilités hebdomadaires |
| `date_overrides` | Exceptions de dates |
| `bookings` | Réservations |

## Licence

MIT
