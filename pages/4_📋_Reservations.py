import streamlit as st
import pandas as pd
from datetime import date
from utils.auth import require_auth, logout
from utils.database import get_bookings, cancel_booking, update_booking
from utils.logo import get_logo

st.set_page_config(
    page_title="Réservations - Apel Calendar",
    page_icon=get_logo(),
    layout="wide"
)

# Protection par mot de passe
require_auth()

# Header
col1, col2 = st.columns([4, 1])
with col1:
    st.title("📋 Réservations")
with col2:
    if st.button("🚪 Déconnexion"):
        logout()

st.divider()

# Filtres
col1, col2, col3 = st.columns(3)

with col1:
    status_filter = st.selectbox(
        "Statut",
        ["Tous", "confirmed", "pending", "cancelled", "completed"],
        format_func=lambda x: {
            "Tous": "📊 Tous",
            "confirmed": "✅ Confirmés",
            "pending": "⏳ En attente",
            "cancelled": "❌ Annulés",
            "completed": "✔️ Terminés"
        }.get(x, x)
    )

with col2:
    date_filter = st.selectbox(
        "Période",
        ["all", "upcoming", "past"],
        format_func=lambda x: {
            "all": "📅 Toutes les dates",
            "upcoming": "📆 À venir",
            "past": "📜 Passées"
        }.get(x, x)
    )

with col3:
    search = st.text_input("🔍 Rechercher", placeholder="Nom, email...")

# Récupérer les réservations
status = None if status_filter == "Tous" else status_filter
upcoming_only = date_filter == "upcoming"

bookings = get_bookings(status=status, upcoming_only=upcoming_only)

# Filtrer par date passée si nécessaire
if date_filter == "past":
    bookings = [b for b in bookings if b["date"] < date.today().isoformat()]

# Filtrer par recherche
if search:
    search_lower = search.lower()
    bookings = [
        b for b in bookings
        if search_lower in b["guest_name"].lower()
        or search_lower in b["guest_email"].lower()
        or search_lower in (b.get("guest_phone") or "").lower()
    ]

st.divider()

# Statistiques rapides
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Total affiché", len(bookings))
with col2:
    confirmed_count = len([b for b in bookings if b["status"] == "confirmed"])
    st.metric("Confirmés", confirmed_count)
with col3:
    pending_count = len([b for b in bookings if b["status"] == "pending"])
    st.metric("En attente", pending_count)

st.divider()

# Liste des réservations
if not bookings:
    st.info("Aucune réservation trouvée avec ces filtres.")
else:
    for booking in bookings:
        event_info = booking.get("event_types", {})
        event_name = event_info.get("name", "Événement") if event_info else "Événement"
        event_color = event_info.get("color", "#3b82f6") if event_info else "#3b82f6"

        # Status badge
        status_badges = {
            "confirmed": ("✅", "Confirmé", "#10b981"),
            "pending": ("⏳", "En attente", "#f59e0b"),
            "cancelled": ("❌", "Annulé", "#ef4444"),
            "completed": ("✔️", "Terminé", "#6b7280")
        }
        status_info = status_badges.get(booking["status"], ("❓", booking["status"], "#6b7280"))

        with st.container():
            col1, col2, col3, col4 = st.columns([3, 2, 2, 2])

            with col1:
                st.markdown(f"""
                <div style="border-left: 4px solid {event_color}; padding-left: 12px;">
                    <strong>{booking['guest_name']}</strong><br>
                    <small style="color: #6b7280;">📧 {booking['guest_email']}</small><br>
                    {f"<small style='color: #6b7280;'>📱 {booking['guest_phone']}</small>" if booking.get('guest_phone') else ""}
                </div>
                """, unsafe_allow_html=True)

            with col2:
                st.write(f"📅 **{booking['date']}**")
                st.write(f"⏰ {booking['start_time'][:5]} - {booking['end_time'][:5]}")

            with col3:
                st.write(f"🎯 {event_name}")
                st.markdown(f"<span style='color: {status_info[2]};'>{status_info[0]} {status_info[1]}</span>", unsafe_allow_html=True)

            with col4:
                if booking["status"] == "confirmed":
                    if st.button("❌ Annuler", key=f"cancel_{booking['id']}"):
                        st.session_state[f"confirm_cancel_{booking['id']}"] = True
                        st.rerun()

                elif booking["status"] == "pending":
                    col_a, col_b = st.columns(2)
                    with col_a:
                        if st.button("✅", key=f"approve_{booking['id']}"):
                            update_booking(booking["id"], {"status": "confirmed"})
                            st.rerun()
                    with col_b:
                        if st.button("❌", key=f"reject_{booking['id']}"):
                            cancel_booking(booking["id"], "Refusé par l'administrateur")
                            st.rerun()

            # Notes
            if booking.get("guest_notes"):
                st.caption(f"📝 Notes: {booking['guest_notes']}")

            # Raison d'annulation
            if booking.get("cancel_reason"):
                st.caption(f"❌ Raison: {booking['cancel_reason']}")

            # Confirmation d'annulation
            if st.session_state.get(f"confirm_cancel_{booking['id']}", False):
                st.warning("⚠️ Êtes-vous sûr de vouloir annuler cette réservation ?")

                cancel_reason = st.text_input(
                    "Raison de l'annulation (optionnel)",
                    key=f"reason_{booking['id']}"
                )

                col_yes, col_no = st.columns(2)
                with col_yes:
                    if st.button("✅ Confirmer l'annulation", key=f"yes_{booking['id']}"):
                        cancel_booking(booking["id"], cancel_reason)
                        del st.session_state[f"confirm_cancel_{booking['id']}"]
                        st.success("Réservation annulée")
                        st.rerun()
                with col_no:
                    if st.button("❌ Retour", key=f"no_{booking['id']}"):
                        del st.session_state[f"confirm_cancel_{booking['id']}"]
                        st.rerun()

            st.divider()

# Export CSV
if bookings:
    st.subheader("📥 Exporter")

    df = pd.DataFrame([{
        "Date": b["date"],
        "Heure": f"{b['start_time'][:5]} - {b['end_time'][:5]}",
        "Nom": b["guest_name"],
        "Email": b["guest_email"],
        "Téléphone": b.get("guest_phone", ""),
        "Statut": b["status"],
        "Notes": b.get("guest_notes", "")
    } for b in bookings])

    csv = df.to_csv(index=False).encode('utf-8')

    st.download_button(
        "📥 Télécharger CSV",
        csv,
        "reservations.csv",
        "text/csv",
        key="download_csv"
    )
