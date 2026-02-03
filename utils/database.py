import streamlit as st
from supabase import create_client, Client
from datetime import datetime, date, time, timedelta
import pandas as pd

# ============================================
# CONNEXION SUPABASE
# ============================================

@st.cache_resource
def get_supabase() -> Client:
    """Initialise et retourne le client Supabase"""
    url = st.secrets["SUPABASE_URL"]
    key = st.secrets["SUPABASE_KEY"]
    return create_client(url, key)

# ============================================
# SETTINGS
# ============================================

def get_settings():
    """Récupère les paramètres globaux"""
    supabase = get_supabase()
    result = supabase.table("settings").select("*").limit(1).execute()
    if result.data:
        return result.data[0]
    return None

def update_settings(data: dict):
    """Met à jour les paramètres"""
    supabase = get_supabase()
    supabase.table("settings").update(data).eq("id", 1).execute()

def verify_admin_password(password: str) -> bool:
    """Vérifie le mot de passe admin"""
    settings = get_settings()
    if settings:
        return settings.get("admin_password") == password
    return False

# ============================================
# EVENT TYPES
# ============================================

def get_event_types(active_only: bool = False):
    """Récupère tous les types d'événements"""
    supabase = get_supabase()
    query = supabase.table("event_types").select("*").order("created_at")
    if active_only:
        query = query.eq("is_active", True)
    result = query.execute()
    return result.data

def get_event_type_by_slug(slug: str):
    """Récupère un type d'événement par son slug"""
    supabase = get_supabase()
    result = supabase.table("event_types").select("*").eq("slug", slug).limit(1).execute()
    if result.data:
        return result.data[0]
    return None

def get_event_type_by_id(event_id: int):
    """Récupère un type d'événement par son ID"""
    supabase = get_supabase()
    result = supabase.table("event_types").select("*").eq("id", event_id).limit(1).execute()
    if result.data:
        return result.data[0]
    return None

def create_event_type(data: dict):
    """Crée un nouveau type d'événement"""
    supabase = get_supabase()
    result = supabase.table("event_types").insert(data).execute()
    return result.data[0] if result.data else None

def update_event_type(event_id: int, data: dict):
    """Met à jour un type d'événement"""
    supabase = get_supabase()
    supabase.table("event_types").update(data).eq("id", event_id).execute()

def delete_event_type(event_id: int):
    """Supprime un type d'événement"""
    supabase = get_supabase()
    supabase.table("event_types").delete().eq("id", event_id).execute()

# ============================================
# AVAILABILITY
# ============================================

def get_availability():
    """Récupère toutes les disponibilités"""
    supabase = get_supabase()
    result = supabase.table("availability").select("*").order("day_of_week").execute()
    return result.data

def get_availability_for_day(day_of_week: int):
    """Récupère les disponibilités pour un jour"""
    supabase = get_supabase()
    result = supabase.table("availability")\
        .select("*")\
        .eq("day_of_week", day_of_week)\
        .eq("is_active", True)\
        .execute()
    return result.data

def update_availability(avail_id: int, data: dict):
    """Met à jour une disponibilité"""
    supabase = get_supabase()
    supabase.table("availability").update(data).eq("id", avail_id).execute()

def create_availability(data: dict):
    """Crée une nouvelle disponibilité"""
    supabase = get_supabase()
    result = supabase.table("availability").insert(data).execute()
    return result.data[0] if result.data else None

def delete_availability(avail_id: int):
    """Supprime une disponibilité"""
    supabase = get_supabase()
    supabase.table("availability").delete().eq("id", avail_id).execute()

# ============================================
# DATE OVERRIDES
# ============================================

def get_date_overrides():
    """Récupère toutes les exceptions de dates"""
    supabase = get_supabase()
    result = supabase.table("date_overrides").select("*").order("date").execute()
    return result.data

def get_date_override(selected_date: date):
    """Récupère l'exception pour une date donnée"""
    supabase = get_supabase()
    result = supabase.table("date_overrides")\
        .select("*")\
        .eq("date", selected_date.isoformat())\
        .limit(1)\
        .execute()
    if result.data:
        return result.data[0]
    return None

def create_date_override(data: dict):
    """Crée une exception de date"""
    supabase = get_supabase()
    result = supabase.table("date_overrides").insert(data).execute()
    return result.data[0] if result.data else None

def delete_date_override(override_id: int):
    """Supprime une exception de date"""
    supabase = get_supabase()
    supabase.table("date_overrides").delete().eq("id", override_id).execute()

# ============================================
# BOOKINGS
# ============================================

def get_bookings(status: str = None, upcoming_only: bool = False):
    """Récupère les réservations"""
    supabase = get_supabase()
    query = supabase.table("bookings")\
        .select("*, event_types(name, color, duration)")\
        .order("date", desc=True)\
        .order("start_time", desc=True)

    if status:
        query = query.eq("status", status)

    if upcoming_only:
        query = query.gte("date", date.today().isoformat())

    result = query.execute()
    return result.data

def get_bookings_for_date(selected_date: date):
    """Récupère les réservations pour une date"""
    supabase = get_supabase()
    result = supabase.table("bookings")\
        .select("*")\
        .eq("date", selected_date.isoformat())\
        .eq("status", "confirmed")\
        .execute()
    return result.data

def get_booking_by_id(booking_id: int):
    """Récupère une réservation par ID"""
    supabase = get_supabase()
    result = supabase.table("bookings")\
        .select("*, event_types(name, color, duration)")\
        .eq("id", booking_id)\
        .limit(1)\
        .execute()
    if result.data:
        return result.data[0]
    return None

def get_booking_by_token(token: str):
    """Récupère une réservation par son token d'annulation"""
    supabase = get_supabase()
    result = supabase.table("bookings")\
        .select("*, event_types(name, color, duration)")\
        .eq("cancel_token", token)\
        .limit(1)\
        .execute()
    if result.data:
        return result.data[0]
    return None

def create_booking(data: dict):
    """Crée une nouvelle réservation"""
    supabase = get_supabase()
    result = supabase.table("bookings").insert(data).execute()
    return result.data[0] if result.data else None

def update_booking(booking_id: int, data: dict):
    """Met à jour une réservation"""
    supabase = get_supabase()
    supabase.table("bookings").update(data).eq("id", booking_id).execute()

def cancel_booking(booking_id: int, reason: str = ""):
    """Annule une réservation"""
    supabase = get_supabase()
    supabase.table("bookings").update({
        "status": "cancelled",
        "cancelled_at": datetime.now().isoformat(),
        "cancel_reason": reason
    }).eq("id", booking_id).execute()

def cancel_booking_by_token(token: str, reason: str = ""):
    """Annule une réservation par son token"""
    supabase = get_supabase()
    supabase.table("bookings").update({
        "status": "cancelled",
        "cancelled_at": datetime.now().isoformat(),
        "cancel_reason": reason
    }).eq("cancel_token", token).execute()

# ============================================
# STATISTIQUES
# ============================================

def get_stats():
    """Récupère les statistiques globales"""
    supabase = get_supabase()

    # Total réservations
    total = supabase.table("bookings").select("id", count="exact").execute()

    # Confirmées
    confirmed = supabase.table("bookings")\
        .select("id", count="exact")\
        .eq("status", "confirmed")\
        .execute()

    # À venir
    upcoming = supabase.table("bookings")\
        .select("id", count="exact")\
        .eq("status", "confirmed")\
        .gte("date", date.today().isoformat())\
        .execute()

    # Annulées
    cancelled = supabase.table("bookings")\
        .select("id", count="exact")\
        .eq("status", "cancelled")\
        .execute()

    # Types d'événements actifs
    event_types = supabase.table("event_types")\
        .select("id", count="exact")\
        .eq("is_active", True)\
        .execute()

    return {
        "total": total.count or 0,
        "confirmed": confirmed.count or 0,
        "upcoming": upcoming.count or 0,
        "cancelled": cancelled.count or 0,
        "event_types": event_types.count or 0
    }

# ============================================
# UTILITAIRES DE CRÉNEAUX
# ============================================

def generate_time_slots(start_time: str, end_time: str, duration: int = 30):
    """Génère les créneaux horaires disponibles"""
    slots = []

    # Parse les heures
    start = datetime.strptime(start_time, "%H:%M:%S" if ":" in start_time and start_time.count(":") == 2 else "%H:%M")
    end = datetime.strptime(end_time, "%H:%M:%S" if ":" in end_time and end_time.count(":") == 2 else "%H:%M")

    current = start
    while current + timedelta(minutes=duration) <= end:
        slot_end = current + timedelta(minutes=duration)
        slots.append({
            "start": current.strftime("%H:%M"),
            "end": slot_end.strftime("%H:%M"),
            "display": f"{current.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}"
        })
        current = slot_end

    return slots

def get_available_slots(selected_date: date, event_type_id: int):
    """Récupère les créneaux disponibles pour une date et un type d'événement"""
    event_type = get_event_type_by_id(event_type_id)
    if not event_type:
        return []

    duration = event_type["duration"]
    day_of_week = selected_date.weekday()

    # Vérifier les exceptions de date
    override = get_date_override(selected_date)
    if override:
        if not override["is_available"]:
            return []
        if override["start_time"] and override["end_time"]:
            availability = [{
                "start_time": override["start_time"],
                "end_time": override["end_time"]
            }]
        else:
            availability = get_availability_for_day(day_of_week)
    else:
        availability = get_availability_for_day(day_of_week)

    # Générer tous les créneaux possibles
    all_slots = []
    for avail in availability:
        slots = generate_time_slots(avail["start_time"], avail["end_time"], duration)
        all_slots.extend(slots)

    # Retirer les créneaux déjà réservés
    bookings = get_bookings_for_date(selected_date)
    booked_times = set()
    for booking in bookings:
        booked_times.add(booking["start_time"][:5])  # Format HH:MM

    available_slots = [s for s in all_slots if s["start"] not in booked_times]

    # Filtrer les créneaux passés si c'est aujourd'hui
    if selected_date == date.today():
        now = datetime.now().strftime("%H:%M")
        available_slots = [s for s in available_slots if s["start"] > now]

    return available_slots

def is_date_available(selected_date: date) -> bool:
    """Vérifie si une date est disponible"""
    day_of_week = selected_date.weekday()

    # Vérifier les exceptions
    override = get_date_override(selected_date)
    if override:
        return override["is_available"]

    # Vérifier les disponibilités normales
    availability = get_availability_for_day(day_of_week)
    return len(availability) > 0
