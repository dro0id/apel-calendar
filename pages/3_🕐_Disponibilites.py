import streamlit as st
from utils.auth import require_auth, logout
from utils.database import (
    get_availability, update_availability, create_availability, delete_availability,
    get_date_overrides, create_date_override, delete_date_override
)
from datetime import date, time, timedelta
from utils.logo import get_logo

st.set_page_config(
    page_title="Disponibilités - Apel Calendar",
    page_icon=get_logo(),
    layout="wide"
)

# Protection par mot de passe
require_auth()

# Header
col1, col2 = st.columns([4, 1])
with col1:
    st.title("🕐 Disponibilités")
with col2:
    if st.button("🚪 Déconnexion"):
        logout()

st.divider()

DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

# Tabs
tab1, tab2 = st.tabs(["📅 Horaires hebdomadaires", "📆 Exceptions de dates"])

# ============================================
# TAB 1: Horaires hebdomadaires
# ============================================

with tab1:
    st.subheader("Définissez vos horaires de disponibilité")
    st.caption("Ces horaires s'appliquent à toutes les semaines.")

    availability = get_availability()

    # Grouper par jour
    avail_by_day = {}
    for avail in availability:
        day = avail["day_of_week"]
        if day not in avail_by_day:
            avail_by_day[day] = []
        avail_by_day[day].append(avail)

    for day_index, day_name in enumerate(DAYS):
        with st.expander(f"**{day_name}**", expanded=day_index < 5):
            day_avails = avail_by_day.get(day_index, [])

            if not day_avails:
                st.info("Aucune disponibilité configurée pour ce jour.")
            else:
                for avail in day_avails:
                    col1, col2, col3, col4 = st.columns([2, 2, 1, 1])

                    with col1:
                        start_time = st.time_input(
                            "Début",
                            value=avail["start_time"] if isinstance(avail["start_time"], type(None)) else
                                  __import__('datetime').datetime.strptime(str(avail["start_time"])[:5], "%H:%M").time(),
                            key=f"start_{avail['id']}",
                            step=timedelta(minutes=10)
                        )

                    with col2:
                        end_time = st.time_input(
                            "Fin",
                            value=avail["end_time"] if isinstance(avail["end_time"], type(None)) else
                                  __import__('datetime').datetime.strptime(str(avail["end_time"])[:5], "%H:%M").time(),
                            key=f"end_{avail['id']}",
                            step=timedelta(minutes=10)
                        )

                    with col3:
                        is_active = st.checkbox(
                            "Actif",
                            value=avail["is_active"],
                            key=f"active_{avail['id']}"
                        )

                    with col4:
                        if st.button("🗑️", key=f"del_avail_{avail['id']}"):
                            delete_availability(avail["id"])
                            st.rerun()

                    # Sauvegarder les changements
                    new_start = start_time.strftime("%H:%M")
                    new_end = end_time.strftime("%H:%M")
                    old_start = str(avail["start_time"])[:5]
                    old_end = str(avail["end_time"])[:5]

                    if new_start != old_start or new_end != old_end or is_active != avail["is_active"]:
                        update_availability(avail["id"], {
                            "start_time": new_start,
                            "end_time": new_end,
                            "is_active": is_active
                        })

            # Bouton pour ajouter un créneau
            if st.button(f"➕ Ajouter un créneau", key=f"add_{day_index}"):
                create_availability({
                    "day_of_week": day_index,
                    "start_time": "09:00",
                    "end_time": "12:00",
                    "is_active": True
                })
                st.rerun()

# ============================================
# TAB 2: Exceptions de dates
# ============================================

with tab2:
    st.subheader("Exceptions de dates")
    st.caption("Bloquez des jours spécifiques (vacances, jours fériés) ou ajoutez des disponibilités exceptionnelles.")

    # Formulaire d'ajout
    with st.expander("➕ Ajouter une exception", expanded=False):
        with st.form("add_override"):
            col1, col2 = st.columns(2)

            with col1:
                override_date = st.date_input(
                    "Date",
                    min_value=date.today(),
                    value=date.today() + timedelta(days=1)
                )
                is_available = st.checkbox("Disponible ce jour ?", value=False)

            with col2:
                reason = st.text_input("Raison (optionnel)", placeholder="Ex: Jour férié, Vacances...")

                if is_available:
                    override_start = st.time_input("Heure de début", value=time(9, 0), step=timedelta(minutes=10))
                    override_end = st.time_input("Heure de fin", value=time(17, 0), step=timedelta(minutes=10))
                else:
                    override_start = None
                    override_end = None

            if st.form_submit_button("✅ Ajouter", use_container_width=True):
                data = {
                    "date": override_date.isoformat(),
                    "is_available": is_available,
                    "reason": reason or ""
                }
                if is_available and override_start and override_end:
                    data["start_time"] = override_start.strftime("%H:%M")
                    data["end_time"] = override_end.strftime("%H:%M")

                try:
                    create_date_override(data)
                    st.success("✅ Exception ajoutée !")
                    st.rerun()
                except Exception as e:
                    st.error(f"Erreur: Cette date existe peut-être déjà.")

    # Liste des exceptions
    st.divider()
    st.subheader("📋 Exceptions configurées")

    overrides = get_date_overrides()

    if not overrides:
        st.info("Aucune exception configurée.")
    else:
        for override in overrides:
            col1, col2, col3, col4 = st.columns([2, 2, 2, 1])

            with col1:
                st.write(f"📅 **{override['date']}**")

            with col2:
                if override["is_available"]:
                    st.success(f"✅ Disponible ({override.get('start_time', '')[:5] if override.get('start_time') else ''} - {override.get('end_time', '')[:5] if override.get('end_time') else ''})")
                else:
                    st.error("❌ Indisponible")

            with col3:
                st.write(override.get("reason", "") or "-")

            with col4:
                if st.button("🗑️", key=f"del_override_{override['id']}"):
                    delete_date_override(override["id"])
                    st.rerun()

            st.divider()
