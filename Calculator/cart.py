import streamlit as st


def init_cart():
    if "cart" not in st.session_state:
        st.session_state.cart = []


def add_to_cart(name, price, qty=1):
    st.session_state.cart.append({
        "name": name,
        "price": price,
        "qty": qty,
        "total": price * qty
    })


def get_cart():
    return st.session_state.cart


def clear_cart():
    st.session_state.cart = []