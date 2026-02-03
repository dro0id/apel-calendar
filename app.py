import streamlit as st
import pandas as pd
from datetime import datetime, timedelta, date
from supabase import create_client, Client

# Configuration de la page
st.set_page_config(
    page_title="Apel Calendar - Prise de rendez-vous",
    page_icon="📅",
    layout="centered"
)

# ============================================
# CONNEXION SUPABASE
# ============================================

@st.cache_resource
def init_supabase() -> Client:
    """Initialise la connexion Supabase"""
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)

supabase = init_supabase()

# ============================================
# BASE DE DONNÉES
# ============================================

def init_availability():
    """Initialise les disponibilités par défaut si la table est vide"""
    result = supabase.table("availability").select("id").limit(1).execute()

    if len(result.data) == 0:
        # Lundi à Vendredi, 9h-12h et 14h-18h
        availability_data = []
        for day in range(0, 5):  # 0=Lundi, 4=Vendredi
            availability_data.append({
                "day_of_week": day,
                "start_time": "09:00",
                "end_time": "12:00",
                "is_active": True
            })
            availability_data.append({
                "day_of_week": day,
                "start_time": "14:00",
                "end_time": "18:00",
                "is_active": True
            })
        supabase.table("availability").insert(availability_data).execute()

def get_availability():
    """Récupère les disponibilités"""
    result = supabase.table("availability").select("*").eq("is_active", True).execute()
    return pd.DataFrame(result.data)

def get_bookings_for_date(selected_date: str):
    """Récupère les réservations pour une date donnée"""
    result = supabase.table("bookings")\
        .select("time_slot")\
        .eq("date", selected_date)\
        .eq("status", "confirmed")\
        .execute()
    return [row['time_slot'] for row in result.data]

def create_booking(selected_date: str, time_slot: str, name: str, email: str, phone: str):
    """Crée une nouvelle réservation"""
    # Vérifier si le créneau n'est pas déjà pris
    existing = supabase.table("bookings")\
        .select("id")\
        .eq("date", selected_date)\
        .eq("time_slot", time_slot)\
        .eq("status", "confirmed")\
        .execute()

    if len(existing.data) > 0:
        return False, "Ce créneau est déjà réservé"

    # Créer la réservation
    supabase.table("bookings").insert({
        "date": selected_date,
        "time_slot": time_slot,
        "name": name,
        "email": email,
        "phone": phone,
        "status": "confirmed"
    }).execute()

    return True, "Réservation confirmée !"

def get_all_bookings():
    """Récupère toutes les réservations"""
    result = supabase.table("bookings")\
        .select("id, date, time_slot, name, email, phone, created_at, status")\
        .order("date", desc=True)\
        .order("time_slot", desc=True)\
        .execute()
    return pd.DataFrame(result.data)

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
    day_of_week = selected_date.weekday()

    availability = get_availability()
    if availability.empty:
        return []

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
    # Initialiser les disponibilités
    init_availability()

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
            filtered['name'].str.contains(search, case=False, na=False) |
            filtered['email'].str.contains(search, case=False, na=False)
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
