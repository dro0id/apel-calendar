# Apel Calendar

Application simple de prise de rendez-vous en ligne, construite avec Streamlit.

## Fonctionnalités

- Calendrier interactif pour choisir une date
- Sélection de créneaux horaires (30 min)
- Formulaire de réservation (nom, email, téléphone)
- Liste des réservations avec filtres
- Base de données SQLite intégrée

## Démo

Disponibilités par défaut : **Lundi - Vendredi, 9h-12h et 14h-18h**

## Installation locale

```bash
# Cloner le repo
git clone https://github.com/dro0id/apel-calendar.git
cd apel-calendar

# Installer les dépendances
pip install -r requirements.txt

# Lancer l'application
streamlit run app.py
```

L'application sera accessible sur `http://localhost:8501`

## Déploiement sur Streamlit Cloud

1. Connectez-vous sur [share.streamlit.io](https://share.streamlit.io)
2. Cliquez sur "New app"
3. Sélectionnez ce repo et la branche `main`
4. Main file: `app.py`
5. Cliquez sur "Deploy"

## Structure

```
apel-calendar/
├── app.py              # Application principale
├── requirements.txt    # Dépendances Python
├── .streamlit/
│   └── config.toml    # Configuration du thème
└── bookings.db        # Base de données (créée automatiquement)
```

## Personnalisation

### Modifier les disponibilités

Dans `app.py`, fonction `init_db()`, modifiez les lignes :

```python
for day in range(0, 5):  # 0=Lundi, 4=Vendredi
    cursor.execute(
        "INSERT INTO availability (day_of_week, start_time, end_time) VALUES (?, ?, ?)",
        (day, "09:00", "12:00")  # Matin
    )
```

### Modifier la durée des créneaux

Dans `app.py`, fonction `get_available_slots_for_date()` :

```python
slots = generate_time_slots(row['start_time'], row['end_time'], duration_minutes=60)  # 1h
```

## Licence

MIT
