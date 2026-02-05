import streamlit as st
from datetime import date, timedelta
from utils.auth import require_auth, logout
from utils.database import get_stats, get_bookings, get_settings
from utils.logo import get_logo

st.set_page_config(
    page_title="Dashboard - Apel Calendar",
    page_icon=get_logo(),
    layout="wide"
)

# Protection par mot de passe
require_auth()

# Header
col1, col2 = st.columns([4, 1])
with col1:
    st.title("📊 Dashboard")
with col2:
    if st.button("🚪 Déconnexion"):
        logout()

st.divider()

# Statistiques
stats = get_stats()

col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.metric("📅 Total réservations", stats["total"])
with col2:
    st.metric("✅ Confirmées", stats["confirmed"])
with col3:
    st.metric("📆 À venir", stats["upcoming"])
with col4:
    st.metric("❌ Annulées", stats["cancelled"])
with col5:
    st.metric("🎯 Types actifs", stats["event_types"])

st.divider()

# Prochains rendez-vous
st.subheader("📆 Prochains rendez-vous")

upcoming_bookings = get_bookings(status="confirmed", upcoming_only=True)

if not upcoming_bookings:
    st.info("Aucun rendez-vous à venir.")
else:
    # Limiter à 10
    for booking in upcoming_bookings[:10]:
        event_info = booking.get("event_types", {})
        event_name = event_info.get("name", "Événement") if event_info else "Événement"
        event_color = event_info.get("color", "#3b82f6") if event_info else "#3b82f6"

        col1, col2, col3, col4 = st.columns([3, 2, 2, 1])

        with col1:
            st.markdown(f"""
            <div style="border-left: 4px solid {event_color}; padding-left: 12px;">
                <strong>{booking['guest_name']}</strong><br>
                <small style="color: #6b7280;">{booking['guest_email']}</small>
            </div>
            """, unsafe_allow_html=True)

        with col2:
            st.write(f"📅 {booking['date']}")

        with col3:
            st.write(f"⏰ {booking['start_time'][:5]}")

        with col4:
            st.write(f"🎯 {event_name}")

        st.divider()

# Lien rapide
st.subheader("🔗 Lien de réservation")
settings = get_settings()
st.info("Partagez ce lien avec vos clients pour qu'ils puissent réserver :")
st.code("https://apel-calendar.streamlit.app/")
