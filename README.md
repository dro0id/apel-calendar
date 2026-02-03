# Apel Calendar

Application simple de prise de rendez-vous en ligne, construite avec Streamlit et Supabase.

## Fonctionnalités

- Calendrier interactif pour choisir une date
- Sélection de créneaux horaires (30 min)
- Formulaire de réservation (nom, email, téléphone)
- Liste des réservations avec filtres
- Base de données Supabase (persistante)

## Démo

Disponibilités par défaut : **Lundi - Vendredi, 9h-12h et 14h-18h**

## Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet (gratuit)
3. Attendez que le projet soit initialisé

### 2. Créer les tables

1. Dans votre dashboard Supabase, allez dans **SQL Editor**
2. Copiez le contenu de `supabase_schema.sql`
3. Exécutez le script

### 3. Récupérer vos clés

1. Allez dans **Settings** > **API**
2. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key

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

L'application sera accessible sur `http://localhost:8501`

## Déploiement sur Streamlit Cloud

1. Connectez-vous sur [share.streamlit.io](https://share.streamlit.io)
2. Cliquez sur **New app**
3. Sélectionnez ce repo et la branche `main`
4. Main file: `app.py`
5. Cliquez sur **Advanced settings** > **Secrets**
6. Ajoutez vos secrets :
   ```toml
   SUPABASE_URL = "https://votre-projet.supabase.co"
   SUPABASE_KEY = "votre-anon-key"
   ```
7. Cliquez sur **Deploy**

## Structure

```
apel-calendar/
├── app.py                      # Application principale
├── requirements.txt            # Dépendances Python
├── supabase_schema.sql         # Script SQL pour créer les tables
├── .streamlit/
│   ├── config.toml             # Configuration du thème
│   └── secrets.toml.example    # Template des secrets
└── README.md
```

## Personnalisation

### Modifier les disponibilités

Modifiez directement dans la table `availability` de Supabase, ou dans `app.py` fonction `init_availability()` :

```python
for day in range(0, 5):  # 0=Lundi, 4=Vendredi
    availability_data.append({
        "day_of_week": day,
        "start_time": "09:00",  # Heure de début
        "end_time": "12:00",    # Heure de fin
        "is_active": True
    })
```

### Modifier la durée des créneaux

Dans `app.py`, fonction `generate_time_slots()` :

```python
slots = generate_time_slots(row['start_time'], row['end_time'], duration_minutes=60)  # 1h
```

## Licence

MIT
