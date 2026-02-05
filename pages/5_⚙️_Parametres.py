import streamlit as st
from utils.auth import require_auth, logout
from utils.database import get_settings, update_settings
from utils.logo import get_logo

st.set_page_config(
    page_title="Paramètres - Apel Calendar",
    page_icon=get_logo(),
    layout="wide"
)

# Protection par mot de passe
require_auth()

# Header
col1, col2 = st.columns([4, 1])
with col1:
    st.title("⚙️ Paramètres")
with col2:
    if st.button("🚪 Déconnexion"):
        logout()

st.divider()

# Récupérer les paramètres
settings = get_settings()

if not settings:
    st.error("Erreur: Impossible de charger les paramètres")
    st.stop()

# Tabs
tab1, tab2, tab3 = st.tabs(["🏢 Entreprise", "🔐 Sécurité", "📧 Notifications"])

# ============================================
# TAB 1: Informations entreprise
# ============================================

with tab1:
    st.subheader("Informations de votre entreprise")
    st.caption("Ces informations seront affichées sur votre page de réservation.")

    with st.form("business_settings"):
        business_name = st.text_input(
            "Nom de l'entreprise",
            value=settings.get("business_name", "")
        )

        welcome_message = st.text_area(
            "Message d'accueil",
            value=settings.get("welcome_message", ""),
            help="Ce message sera affiché en haut de votre page de réservation."
        )

        col1, col2 = st.columns(2)

        with col1:
            business_email = st.text_input(
                "Email de contact",
                value=settings.get("business_email", "")
            )

        with col2:
            business_phone = st.text_input(
                "Téléphone",
                value=settings.get("business_phone", "")
            )

        timezone = st.selectbox(
            "Fuseau horaire",
            ["Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"],
            index=["Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"].index(
                settings.get("timezone", "Europe/Paris")
            ) if settings.get("timezone") in ["Europe/Paris", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"] else 0
        )

        if st.form_submit_button("💾 Enregistrer", use_container_width=True):
            update_settings({
                "business_name": business_name,
                "welcome_message": welcome_message,
                "business_email": business_email,
                "business_phone": business_phone,
                "timezone": timezone
            })
            st.success("✅ Paramètres enregistrés !")

# ============================================
# TAB 2: Sécurité
# ============================================

with tab2:
    st.subheader("Sécurité")
    st.caption("Modifiez votre mot de passe d'administration.")

    with st.form("security_settings"):
        st.warning("⚠️ Changez le mot de passe par défaut pour sécuriser votre application !")

        current_password = st.text_input(
            "Mot de passe actuel",
            type="password"
        )

        new_password = st.text_input(
            "Nouveau mot de passe",
            type="password"
        )

        confirm_password = st.text_input(
            "Confirmer le nouveau mot de passe",
            type="password"
        )

        if st.form_submit_button("🔐 Changer le mot de passe", use_container_width=True):
            if not current_password or not new_password or not confirm_password:
                st.error("❌ Veuillez remplir tous les champs")
            elif current_password != settings.get("admin_password"):
                st.error("❌ Mot de passe actuel incorrect")
            elif new_password != confirm_password:
                st.error("❌ Les nouveaux mots de passe ne correspondent pas")
            elif len(new_password) < 6:
                st.error("❌ Le mot de passe doit contenir au moins 6 caractères")
            else:
                update_settings({"admin_password": new_password})
                st.success("✅ Mot de passe modifié avec succès !")

    st.divider()

    st.subheader("🔑 Informations de connexion")
    st.info(f"""
    **Mot de passe actuel:** {'*' * len(settings.get('admin_password', ''))}

    Pour vous connecter à l'administration, utilisez ce mot de passe sur n'importe quelle page admin.
    """)

# ============================================
# TAB 3: Notifications
# ============================================

with tab3:
    st.subheader("Notifications par email")
    st.caption("Configurez les notifications automatiques.")

    st.info("""
    🚧 **Fonctionnalité à venir**

    Les notifications par email seront bientôt disponibles :
    - Confirmation de réservation
    - Rappel avant le rendez-vous
    - Notification d'annulation

    Pour l'instant, vous pouvez gérer les réservations manuellement depuis la page "Réservations".
    """)

    st.divider()

    st.subheader("🔗 Intégrations")

    st.info("""
    🚧 **Fonctionnalité à venir**

    Intégrations prévues :
    - Google Calendar
    - Outlook Calendar
    - Webhooks personnalisés
    """)

# Footer
st.divider()
st.caption("Apel Calendar v1.0")
