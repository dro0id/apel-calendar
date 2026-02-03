import streamlit as st
from utils.database import verify_admin_password

def init_session_state():
    """Initialise les variables de session"""
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
    if "current_page" not in st.session_state:
        st.session_state.current_page = "home"

def login_form():
    """Affiche le formulaire de connexion"""
    st.subheader("🔐 Connexion Administration")

    with st.form("login_form"):
        password = st.text_input("Mot de passe", type="password")
        submitted = st.form_submit_button("Se connecter", use_container_width=True)

        if submitted:
            if verify_admin_password(password):
                st.session_state.authenticated = True
                st.rerun()
            else:
                st.error("❌ Mot de passe incorrect")

def logout():
    """Déconnecte l'utilisateur"""
    st.session_state.authenticated = False
    st.rerun()

def require_auth():
    """Décorateur pour protéger une page"""
    init_session_state()
    if not st.session_state.authenticated:
        login_form()
        st.stop()

def is_authenticated() -> bool:
    """Vérifie si l'utilisateur est authentifié"""
    init_session_state()
    return st.session_state.authenticated
