import streamlit as st
from utils.database import get_booking_by_token, cancel_booking_by_token
from utils.logo import get_logo

st.set_page_config(
    page_title="Annulation - Apel Calendar",
    page_icon=get_logo(),
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Cacher la sidebar et le menu sur cette page publique
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    [data-testid="stSidebar"] {display: none;}
</style>
""", unsafe_allow_html=True)

st.title("❌ Annuler un rendez-vous")
st.divider()

# Récupérer le token depuis l'URL ou le formulaire
params = st.query_params
token = params.get("token", "")

if not token:
    st.markdown("Entrez votre code d'annulation pour annuler votre rendez-vous.")
    token = st.text_input("Code d'annulation", placeholder="Votre code d'annulation...")

if not token:
    st.stop()

# Chercher la réservation
booking = get_booking_by_token(token)

if not booking:
    st.error("❌ Code d'annulation invalide. Vérifiez votre code et réessayez.")
    st.stop()

event_info = booking.get("event_types", {})
event_name = event_info.get("name", "Rendez-vous") if event_info else "Rendez-vous"

if booking["status"] == "cancelled":
    st.warning("⚠️ Ce rendez-vous a déjà été annulé.")
    st.markdown(f"""
    **Détails :**
    - 📅 **Date :** {booking['date']}
    - ⏰ **Heure :** {booking['start_time'][:5]} - {booking['end_time'][:5]}
    - 🏷️ **Type :** {event_name}
    - ❌ **Annulé le :** {booking.get('cancelled_at', 'N/A')}
    """)
    st.stop()

if booking["status"] == "completed":
    st.info("Ce rendez-vous est déjà passé et ne peut plus être annulé.")
    st.stop()

# Afficher les détails du rendez-vous
st.markdown(f"""
**Votre rendez-vous :**
- 🏷️ **Type :** {event_name}
- 📅 **Date :** {booking['date']}
- ⏰ **Heure :** {booking['start_time'][:5]} - {booking['end_time'][:5]}
- 👤 **Nom :** {booking['guest_name']}
- 📧 **Email :** {booking['guest_email']}
""")

st.divider()

st.warning("⚠️ Cette action est irréversible. Votre créneau sera libéré.")

with st.form("cancel_form"):
    reason = st.text_area(
        "Raison de l'annulation (optionnel)",
        placeholder="Ex: Empêchement, changement de programme...",
        height=80
    )
    submitted = st.form_submit_button("❌ Confirmer l'annulation", use_container_width=True)

    if submitted:
        cancel_booking_by_token(token, reason)
        st.success("✅ Votre rendez-vous a été annulé avec succès.")
        st.balloons()
        st.rerun()
