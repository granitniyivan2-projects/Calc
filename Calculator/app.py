import streamlit as st
from registry import load_plugins
from cart import init_cart

init_cart()

st.set_page_config(page_title="Калькулятор", layout="centered")





# --- Основное приложение ---
st.title("🧮 Калькулятор услуг")

col1, col2 = st.columns([6, 1])
with col2:
    if st.button("🚪"):
        logout()

plugins = load_plugins()

names = [p["name"] for p in plugins]

selected = st.selectbox("Выберите услугу", names)

for p in plugins:
    if p["name"] == selected:
        p["render"]()