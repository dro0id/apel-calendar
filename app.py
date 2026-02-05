import streamlit as st
from datetime import date, timedelta, datetime
from utils.database import (
    get_settings, get_event_types, get_event_type_by_slug,
    get_available_slots, is_date_available, create_booking,
    get_event_type_dates
)

# ============================================
# CONFIGURATION
# ============================================

st.set_page_config(
    page_title="Apel Calendar - Réservation",
    page_icon="📅",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# ============================================
# STYLES CSS
# ============================================

st.markdown("""
<style>
    /* Cacher le menu hamburger sur la page publique */
    #MainMenu {visibility: hidden;}

    /* Style des cartes d'événements */
    .event-card {
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        margin: 10px 0;
        transition: all 0.2s;
        cursor: pointer;
    }
    .event-card:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }

    /* Style des créneaux horaires */
    .time-slot {
        display: inline-block;
        padding: 10px 20px;
        margin: 5px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    .time-slot:hover {
        background-color: #3b82f6;
        color: white;
    }

    /* Succès */
    .success-box {
        background-color: #ecfdf5;
        border: 1px solid #10b981;
        border-radius: 12px;
        padding: 24px;
        text-align: center;
    }
</style>
""", unsafe_allow_html=True)

# ============================================
# FONCTIONS D'AFFICHAGE
# ============================================

def show_event_types():
    """Affiche la liste des types d'événements"""
    settings = get_settings()
    event_types = get_event_types(active_only=True)

    # Header
    st.title(f"📅 {settings['business_name'] if settings else 'Apel Calendar'}")
    st.markdown(settings['welcome_message'] if settings else "Bienvenue ! Choisissez un type de rendez-vous.")
    st.divider()

    if not event_types:
        st.warning("Aucun type de rendez-vous disponible pour le moment.")
        return

    # Afficher les types d'événements
    st.subheader("Choisissez un type de rendez-vous")

    for event in event_types:
        col1, col2 = st.columns([4, 1])
        with col1:
            st.markdown(f"""
            <div style="border-left: 4px solid {event['color']}; padding-left: 16px; margin: 16px 0;">
                <h4 style="margin: 0;">{event['name']}</h4>
                <p style="color: #6b7280; margin: 4px 0;">{event['description']}</p>
                <small>⏱️ {event['duration']} minutes</small>
            </div>
            """, unsafe_allow_html=True)
        with col2:
            if st.button("Réserver", key=f"book_{event['id']}", use_container_width=True):
                st.session_state.selected_event = event
                st.session_state.booking_step = "date"
                st.rerun()

def show_date_selection():
    """Affiche la sélection de date"""
    event = st.session_state.selected_event

    # Header avec retour
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("← Retour"):
            st.session_state.booking_step = "event"
            st.session_state.pop("picked_date", None)
            st.rerun()
    with col2:
        st.markdown(f"### {event['name']}")
        st.caption(f"⏱️ {event['duration']} minutes")

    st.divider()
    st.subheader("📅 Choisissez une date")

    if event.get("use_specific_dates"):
        # Mode dates spécifiques : afficher uniquement les dates autorisées
        specific_dates = get_event_type_dates(event["id"])
        # Filtrer les dates passées et trier
        today = date.today()
        future_dates = []
        for d in specific_dates:
            parsed = date.fromisoformat(d["date"])
            if parsed > today:
                future_dates.append(parsed)
        future_dates.sort()

        if not future_dates:
            st.warning("😔 Aucune date disponible pour cet événement.")
            return

        # Afficher les dates sous forme de boutons
        st.markdown("Dates disponibles :")
        cols = st.columns(3)
        for i, d in enumerate(future_dates):
            with cols[i % 3]:
                label = d.strftime("%A %d/%m/%Y")
                is_selected = st.session_state.get("picked_date") == d
                if st.button(
                    f"{'✅' if is_selected else '📅'} {label}",
                    key=f"date_{d.isoformat()}",
                    use_container_width=True
                ):
                    st.session_state.picked_date = d
                    st.rerun()

        selected_date = st.session_state.get("picked_date")
        if selected_date is None:
            return

    else:
        # Mode classique : date picker libre avec disponibilités générales
        min_notice = event.get("min_notice_hours", 24)
        max_days = event.get("max_days_ahead", 60)

        min_date = date.today() + timedelta(days=1)
        if min_notice > 24:
            min_date = date.today() + timedelta(hours=min_notice)
        max_date = date.today() + timedelta(days=max_days)

        selected_date = st.date_input(
            "Date du rendez-vous",
            min_value=min_date,
            max_value=max_date,
            value=min_date,
            format="DD/MM/YYYY"
        )

    # Vérifier la disponibilité
    if not is_date_available(selected_date, event_type=event):
        st.warning("⚠️ Cette date n'est pas disponible. Veuillez en choisir une autre.")
        return

    # Récupérer les créneaux disponibles
    slots = get_available_slots(selected_date, event["id"])

    if not slots:
        st.warning("😔 Aucun créneau disponible pour cette date.")
        return

    st.divider()
    st.subheader("⏰ Choisissez un horaire")

    # Afficher les créneaux en grille
    cols = st.columns(4)
    for i, slot in enumerate(slots):
        with cols[i % 4]:
            if st.button(slot["start"], key=f"slot_{slot['start']}", use_container_width=True):
                st.session_state.selected_date = selected_date
                st.session_state.selected_slot = slot
                st.session_state.booking_step = "form"
                st.rerun()

def show_booking_form():
    """Affiche le formulaire de réservation"""
    event = st.session_state.selected_event
    selected_date = st.session_state.selected_date
    slot = st.session_state.selected_slot

    # Header avec retour
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("← Retour"):
            st.session_state.booking_step = "date"
            st.rerun()
    with col2:
        st.markdown(f"### {event['name']}")

    st.divider()

    # Récapitulatif
    st.markdown(f"""
    **Récapitulatif :**
    - 📅 **Date :** {selected_date.strftime('%A %d %B %Y')}
    - ⏰ **Heure :** {slot['display']}
    - ⏱️ **Durée :** {event['duration']} minutes
    """)

    st.divider()
    st.subheader("📝 Vos informations")

    with st.form("booking_form"):
        col_a, col_b = st.columns(2)

        with col_a:
            guest_name = st.text_input("Nom complet *", placeholder="Jean Dupont")
            guest_email = st.text_input("Email *", placeholder="jean@exemple.com")

        with col_b:
            guest_phone = st.text_input("Téléphone", placeholder="06 12 34 56 78")
            guest_notes = st.text_area("Notes (optionnel)", placeholder="Informations complémentaires...", height=80)

        submitted = st.form_submit_button("✅ Confirmer la réservation", use_container_width=True)

        if submitted:
            # Validation
            if not guest_name or not guest_email:
                st.error("❌ Veuillez remplir les champs obligatoires (nom et email).")
            elif "@" not in guest_email or "." not in guest_email:
                st.error("❌ Veuillez entrer un email valide.")
            else:
                # Créer la réservation
                booking_data = {
                    "event_type_id": event["id"],
                    "date": selected_date.isoformat(),
                    "start_time": slot["start"],
                    "end_time": slot["end"],
                    "guest_name": guest_name,
                    "guest_email": guest_email,
                    "guest_phone": guest_phone or "",
                    "guest_notes": guest_notes or "",
                    "status": "pending" if event.get("requires_approval") else "confirmed"
                }

                booking = create_booking(booking_data)

                if booking:
                    st.session_state.booking_result = booking
                    st.session_state.booking_step = "success"
                    st.rerun()
                else:
                    st.error("❌ Une erreur est survenue. Veuillez réessayer.")

def show_success():
    """Affiche la confirmation de réservation"""
    booking = st.session_state.booking_result
    event = st.session_state.selected_event

    st.balloons()

    st.markdown("""
    <div style="text-align: center; padding: 40px 20px;">
        <h1>🎉</h1>
        <h2>Réservation confirmée !</h2>
    </div>
    """, unsafe_allow_html=True)

    st.success(f"Votre rendez-vous **{event['name']}** a été réservé avec succès.")

    st.markdown(f"""
    ---
    **Récapitulatif :**

    - 📅 **Date :** {booking['date']}
    - ⏰ **Heure :** {booking['start_time'][:5]} - {booking['end_time'][:5]}
    - 👤 **Nom :** {booking['guest_name']}
    - 📧 **Email :** {booking['guest_email']}

    ---

    Un email de confirmation vous a été envoyé à **{booking['guest_email']}**.

    Vous pouvez annuler votre rendez-vous à tout moment en utilisant le lien dans l'email.
    """)

    if st.button("📅 Prendre un autre rendez-vous", use_container_width=True):
        # Reset session
        for key in ["selected_event", "selected_date", "selected_slot", "booking_result", "booking_step", "picked_date"]:
            if key in st.session_state:
                del st.session_state[key]
        st.rerun()

# ============================================
# MAIN
# ============================================

def main():
    # Initialiser le step si nécessaire
    if "booking_step" not in st.session_state:
        st.session_state.booking_step = "event"

    # Router
    step = st.session_state.booking_step

    if step == "event":
        show_event_types()
    elif step == "date":
        show_date_selection()
    elif step == "form":
        show_booking_form()
    elif step == "success":
        show_success()

if __name__ == "__main__":
    main()
