import streamlit as st
import re
from utils.auth import require_auth, logout
from utils.database import (
    get_event_types, create_event_type, update_event_type, delete_event_type
)

st.set_page_config(
    page_title="Types d'événements - Apel Calendar",
    page_icon="🎯",
    layout="wide"
)

# Protection par mot de passe
require_auth()

# Header
col1, col2 = st.columns([4, 1])
with col1:
    st.title("🎯 Types d'événements")
with col2:
    if st.button("🚪 Déconnexion"):
        logout()

st.divider()

# Couleurs disponibles
COLORS = [
    ("#3b82f6", "Bleu"),
    ("#10b981", "Vert"),
    ("#f59e0b", "Orange"),
    ("#ef4444", "Rouge"),
    ("#8b5cf6", "Violet"),
    ("#ec4899", "Rose"),
    ("#06b6d4", "Cyan"),
    ("#84cc16", "Lime"),
]

def generate_slug(name: str) -> str:
    """Génère un slug à partir du nom"""
    slug = name.lower()
    slug = re.sub(r'[àáâãäå]', 'a', slug)
    slug = re.sub(r'[èéêë]', 'e', slug)
    slug = re.sub(r'[ìíîï]', 'i', slug)
    slug = re.sub(r'[òóôõö]', 'o', slug)
    slug = re.sub(r'[ùúûü]', 'u', slug)
    slug = re.sub(r'[ç]', 'c', slug)
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug

# Bouton pour créer
if st.button("➕ Nouveau type d'événement", type="primary"):
    st.session_state.show_create_form = True

# Formulaire de création
if st.session_state.get("show_create_form", False):
    with st.expander("Créer un nouveau type d'événement", expanded=True):
        with st.form("create_event_type"):
            col1, col2 = st.columns(2)

            with col1:
                name = st.text_input("Nom *", placeholder="Ex: Consultation 30 min")
                description = st.text_area("Description", placeholder="Description du type de rendez-vous...")
                duration = st.selectbox("Durée (minutes)", [15, 30, 45, 60, 90, 120], index=1)

            with col2:
                color = st.selectbox(
                    "Couleur",
                    options=[c[0] for c in COLORS],
                    format_func=lambda x: next((c[1] for c in COLORS if c[0] == x), x)
                )
                location = st.text_input("Lieu (optionnel)", placeholder="Ex: Visioconférence, Bureau...")
                is_active = st.checkbox("Actif", value=True)

            st.markdown("**Options avancées**")
            col3, col4 = st.columns(2)

            with col3:
                min_notice = st.number_input("Préavis minimum (heures)", min_value=0, value=24)
                buffer_before = st.number_input("Buffer avant (minutes)", min_value=0, value=0)

            with col4:
                max_days = st.number_input("Réservation max (jours)", min_value=1, value=60)
                buffer_after = st.number_input("Buffer après (minutes)", min_value=0, value=0)

            requires_approval = st.checkbox("Nécessite approbation")

            col_submit, col_cancel = st.columns(2)
            with col_submit:
                submitted = st.form_submit_button("✅ Créer", use_container_width=True)
            with col_cancel:
                if st.form_submit_button("❌ Annuler", use_container_width=True):
                    st.session_state.show_create_form = False
                    st.rerun()

            if submitted:
                if not name:
                    st.error("Le nom est obligatoire")
                else:
                    slug = generate_slug(name)
                    data = {
                        "name": name,
                        "slug": slug,
                        "description": description or "",
                        "duration": duration,
                        "color": color,
                        "location": location or "",
                        "is_active": is_active,
                        "min_notice_hours": min_notice,
                        "max_days_ahead": max_days,
                        "buffer_before": buffer_before,
                        "buffer_after": buffer_after,
                        "requires_approval": requires_approval
                    }
                    try:
                        create_event_type(data)
                        st.success("✅ Type d'événement créé !")
                        st.session_state.show_create_form = False
                        st.rerun()
                    except Exception as e:
                        st.error(f"Erreur: {e}")

st.divider()

# Liste des types d'événements
st.subheader("📋 Types d'événements existants")

event_types = get_event_types()

if not event_types:
    st.info("Aucun type d'événement. Créez-en un pour commencer !")
else:
    for event in event_types:
        with st.container():
            col1, col2, col3, col4 = st.columns([4, 1, 1, 1])

            with col1:
                status_badge = "✅" if event["is_active"] else "⏸️"
                st.markdown(f"""
                <div style="border-left: 4px solid {event['color']}; padding-left: 16px;">
                    <strong>{event['name']}</strong> {status_badge}<br>
                    <small style="color: #6b7280;">{event['description'] or 'Pas de description'}</small><br>
                    <small>⏱️ {event['duration']} min | 🔗 /{event['slug']}</small>
                </div>
                """, unsafe_allow_html=True)

            with col2:
                # Toggle actif/inactif
                new_status = st.toggle(
                    "Actif",
                    value=event["is_active"],
                    key=f"toggle_{event['id']}"
                )
                if new_status != event["is_active"]:
                    update_event_type(event["id"], {"is_active": new_status})
                    st.rerun()

            with col3:
                if st.button("✏️", key=f"edit_{event['id']}"):
                    st.session_state[f"editing_{event['id']}"] = True
                    st.rerun()

            with col4:
                if st.button("🗑️", key=f"delete_{event['id']}"):
                    st.session_state[f"confirm_delete_{event['id']}"] = True
                    st.rerun()

            # Confirmation de suppression
            if st.session_state.get(f"confirm_delete_{event['id']}", False):
                st.warning(f"⚠️ Supprimer **{event['name']}** ? Cette action est irréversible.")
                col_yes, col_no = st.columns(2)
                with col_yes:
                    if st.button("✅ Confirmer", key=f"confirm_yes_{event['id']}"):
                        delete_event_type(event["id"])
                        del st.session_state[f"confirm_delete_{event['id']}"]
                        st.rerun()
                with col_no:
                    if st.button("❌ Annuler", key=f"confirm_no_{event['id']}"):
                        del st.session_state[f"confirm_delete_{event['id']}"]
                        st.rerun()

            # Formulaire d'édition
            if st.session_state.get(f"editing_{event['id']}", False):
                with st.form(f"edit_form_{event['id']}"):
                    col1, col2 = st.columns(2)
                    with col1:
                        edit_name = st.text_input("Nom", value=event["name"])
                        edit_description = st.text_area("Description", value=event["description"] or "")
                        edit_duration = st.selectbox(
                            "Durée",
                            [15, 30, 45, 60, 90, 120],
                            index=[15, 30, 45, 60, 90, 120].index(event["duration"])
                        )
                    with col2:
                        edit_color = st.selectbox(
                            "Couleur",
                            options=[c[0] for c in COLORS],
                            index=[c[0] for c in COLORS].index(event["color"]) if event["color"] in [c[0] for c in COLORS] else 0,
                            format_func=lambda x: next((c[1] for c in COLORS if c[0] == x), x)
                        )
                        edit_location = st.text_input("Lieu", value=event["location"] or "")

                    col_save, col_cancel = st.columns(2)
                    with col_save:
                        if st.form_submit_button("💾 Enregistrer", use_container_width=True):
                            update_event_type(event["id"], {
                                "name": edit_name,
                                "description": edit_description,
                                "duration": edit_duration,
                                "color": edit_color,
                                "location": edit_location,
                                "slug": generate_slug(edit_name)
                            })
                            del st.session_state[f"editing_{event['id']}"]
                            st.rerun()
                    with col_cancel:
                        if st.form_submit_button("❌ Annuler", use_container_width=True):
                            del st.session_state[f"editing_{event['id']}"]
                            st.rerun()

            st.divider()
