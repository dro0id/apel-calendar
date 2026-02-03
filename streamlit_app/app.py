import streamlit as st
import sqlite3
import pandas as pd
from datetime import datetime, timedelta, date
import os

# Configuration de la page
st.set_page_config(
    page_title="Apel Calendar - Prise de rendez-vous",
    page_icon="📅",
    layout="centered"
)

# Chemin de la base de données
DB_PATH = os.path.join(os.path.dirname(__file__), "bookings.db")

# ============================================
# BASE DE DONNÉES
# ============================================

def init_db():
    """Initialise la base de données"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table des créneaux disponibles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day_of_week INTEGER NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1
        )
    """)

    # Table des réservations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'confirmed'
        )
    """)

    # Insérer les disponibilités par défaut si la table est vide
    cursor.execute("SELECT COUNT(*) FROM availability")
    if cursor.fetchone()[0] == 0:
        # Lundi à Vendredi, 9h-12h et 14h-18h
        for day in range(0, 5):  # 0=Lundi, 4=Vendredi
            cursor.execute(
                "INSERT INTO availability (day_of_week, start_time, end_time) VALUES (?, ?, ?)",
                (day, "09:00", "12:00")
            )
            cursor.execute(
                "INSERT INTO availability (day_of_week, start_time, end_time) VALUES (?, ?, ?)",
                (day, "14:00", "18:00")
            )

    conn.commit()
    conn.close()

def get_availability():
    """Récupère les disponibilités"""
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        "SELECT * FROM availability WHERE is_active = 1",
        conn
    )
    conn.close()
    return df

def get_bookings_for_date(selected_date: str):
    """Récupère les réservations pour une date donnée"""
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        "SELECT time_slot FROM bookings WHERE date = ? AND status = 'confirmed'",
        conn,
        params=(selected_date,)
    )
    conn.close()
    return df['time_slot'].tolist()

def create_booking(selected_date: str, time_slot: str, name: str, email: str, phone: str):
    """Crée une nouvelle réservation"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Vérifier si le créneau n'est pas déjà pris
    cursor.execute(
        "SELECT id FROM bookings WHERE date = ? AND time_slot = ? AND status = 'confirmed'",
        (selected_date, time_slot)
    )
    if cursor.fetchone():
        conn.close()
        return False, "Ce créneau est déjà réservé"

    cursor.execute(
        "INSERT INTO bookings (date, time_slot, name, email, phone) VALUES (?, ?, ?, ?, ?)",
        (selected_date, time_slot, name, email, phone)
    )
    conn.commit()
    conn.close()
    return True, "Réservation confirmée !"

def get_all_bookings():
    """Récupère toutes les réservations"""
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(
        """SELECT id, date, time_slot, name, email, phone, created_at, status
           FROM bookings
           ORDER BY date DESC, time_slot DESC""",
        conn
    )
    conn.close()
    return df

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

def generate_time_slots(start_time: str, end_time: str, duration_minutes: int = 30):
    """Génère les créneaux horaires"""
    slots = []
    start = datetime.strptime(start_time, "%H:%M")
    end = datetime.strptime(end_time, "%H:%M")

    current = start
    while current + timedelta(minutes=duration_minutes) <= end:
        slot_end = current + timedelta(minutes=duration_minutes)
        slots.append(f"{current.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}")
        current = slot_end

    return slots

def get_available_slots_for_date(selected_date: date):
    """Récupère les créneaux disponibles pour une date"""
    # Jour de la semaine (0=Lundi en Python, mais nous utilisons aussi 0=Lundi)
    day_of_week = selected_date.weekday()

    availability = get_availability()
    day_availability = availability[availability['day_of_week'] == day_of_week]

    all_slots = []
    for _, row in day_availability.iterrows():
        slots = generate_time_slots(row['start_time'], row['end_time'])
        all_slots.extend(slots)

    # Retirer les créneaux déjà réservés
    booked_slots = get_bookings_for_date(selected_date.isoformat())
    available_slots = [s for s in all_slots if s not in booked_slots]

    return available_slots

# ============================================
# INTERFACE UTILISATEUR
# ============================================

def main():
    # Initialiser la base de données
    init_db()

    # Header
    st.title("📅 Apel Calendar")
    st.markdown("### Prenez rendez-vous en quelques clics")
    st.divider()

    # Tabs pour navigation
    tab1, tab2 = st.tabs(["📆 Réserver", "📋 Mes réservations"])

    with tab1:
        booking_page()

    with tab2:
        admin_page()

def booking_page():
    """Page de réservation"""

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("1. Choisissez une date")

        # Date minimum = demain
        min_date = date.today() + timedelta(days=1)
        max_date = date.today() + timedelta(days=60)

        selected_date = st.date_input(
            "Date du rendez-vous",
            min_value=min_date,
            max_value=max_date,
            value=min_date,
            format="DD/MM/YYYY"
        )

        # Vérifier si c'est un jour ouvré
        if selected_date.weekday() >= 5:  # Samedi ou Dimanche
            st.warning("⚠️ Pas de disponibilité le week-end. Veuillez choisir un jour de semaine.")
            return

    with col2:
        st.subheader("2. Choisissez un créneau")

        available_slots = get_available_slots_for_date(selected_date)

        if not available_slots:
            st.warning("😔 Aucun créneau disponible pour cette date.")
            return

        selected_slot = st.selectbox(
            "Créneau horaire",
            options=available_slots,
            index=0
        )

    st.divider()
    st.subheader("3. Vos informations")

    with st.form("booking_form"):
        col_a, col_b = st.columns(2)

        with col_a:
            name = st.text_input("Nom complet *", placeholder="Jean Dupont")
            email = st.text_input("Email *", placeholder="jean@exemple.com")

        with col_b:
            phone = st.text_input("Téléphone *", placeholder="06 12 34 56 78")

        st.markdown("---")

        # Résumé
        st.markdown(f"""
        **Récapitulatif :**
        - 📅 Date : **{selected_date.strftime('%A %d %B %Y').capitalize()}**
        - ⏰ Heure : **{selected_slot}**
        """)

        submitted = st.form_submit_button("✅ Confirmer la réservation", use_container_width=True)

        if submitted:
            # Validation
            if not name or not email or not phone:
                st.error("❌ Veuillez remplir tous les champs obligatoires.")
            elif "@" not in email:
                st.error("❌ Veuillez entrer un email valide.")
            elif len(phone) < 10:
                st.error("❌ Veuillez entrer un numéro de téléphone valide.")
            else:
                success, message = create_booking(
                    selected_date.isoformat(),
                    selected_slot,
                    name,
                    email,
                    phone
                )
                if success:
                    st.success(f"🎉 {message}")
                    st.balloons()
                    st.info(f"""
                    **Votre rendez-vous est confirmé !**

                    Vous recevrez un rappel à l'adresse : {email}

                    📅 {selected_date.strftime('%A %d %B %Y')}
                    ⏰ {selected_slot}
                    """)
                else:
                    st.error(f"❌ {message}")

def admin_page():
    """Page de visualisation des réservations"""

    st.subheader("📋 Toutes les réservations")

    bookings = get_all_bookings()

    if bookings.empty:
        st.info("Aucune réservation pour le moment.")
        return

    # Filtres
    col1, col2 = st.columns(2)
    with col1:
        status_filter = st.selectbox(
            "Filtrer par statut",
            ["Tous", "confirmed", "cancelled"]
        )
    with col2:
        search = st.text_input("Rechercher (nom, email)", "")

    # Appliquer les filtres
    filtered = bookings.copy()
    if status_filter != "Tous":
        filtered = filtered[filtered['status'] == status_filter]
    if search:
        filtered = filtered[
            filtered['name'].str.contains(search, case=False) |
            filtered['email'].str.contains(search, case=False)
        ]

    # Afficher le tableau
    if not filtered.empty:
        # Renommer les colonnes pour l'affichage
        display_df = filtered.rename(columns={
            'date': 'Date',
            'time_slot': 'Créneau',
            'name': 'Nom',
            'email': 'Email',
            'phone': 'Téléphone',
            'status': 'Statut'
        })[['Date', 'Créneau', 'Nom', 'Email', 'Téléphone', 'Statut']]

        st.dataframe(display_df, use_container_width=True, hide_index=True)

        # Stats
        st.divider()
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total réservations", len(bookings))
        with col2:
            confirmed = len(bookings[bookings['status'] == 'confirmed'])
            st.metric("Confirmées", confirmed)
        with col3:
            today = date.today().isoformat()
            upcoming = len(bookings[(bookings['date'] >= today) & (bookings['status'] == 'confirmed')])
            st.metric("À venir", upcoming)
    else:
        st.warning("Aucun résultat pour ces filtres.")

if __name__ == "__main__":
    main()
