import streamlit as st
import time


def round_to_10(value):
    return int(round(value / 10) * 10)


def adjust_to_step(value, step=10):
    lower = (value // step) * step
    upper = lower + step
    return lower, upper


def canvas_page():

    st.subheader("🖼 Холсты")

    # ---------------------------
    # 🎨 СТИЛЬ КНОПОК
    # ---------------------------
    st.markdown("""
    <style>
    div.stButton > button {
        border-radius: 999px;
        padding: 8px 18px;
        font-weight: 500;
    }
    </style>
    """, unsafe_allow_html=True)

    # ---------------------------
    # ⏱ ПОКАЗ ПРЕДУПРЕЖДЕНИЯ 140
    # ---------------------------
    if "limit_warning_time" in st.session_state:
        if time.time() - st.session_state.limit_warning_time < 5:
            st.warning("Нельзя два размера больше 140 см (ограничение полотна)")
        else:
            del st.session_state.limit_warning_time

    # ---------------------------
    # 📦 ПРИМЕНЕНИЕ ИЗМЕНЕНИЙ
    # ---------------------------
    if "apply_size1" in st.session_state:
        st.session_state.size1 = st.session_state.apply_size1
        del st.session_state.apply_size1

    if "apply_size2" in st.session_state:
        st.session_state.size2 = st.session_state.apply_size2
        del st.session_state.apply_size2

    # ---------------------------
    # 🔢 ИНИЦИАЛИЗАЦИЯ
    # ---------------------------
    if "size1" not in st.session_state:
        st.session_state.size1 = 50

    if "size2" not in st.session_state:
        st.session_state.size2 = 50

    show_details = st.checkbox("Показать подробный расчёт")

    # ---------------------------
    # 🔢 ВВОД
    # ---------------------------
    st.number_input("Размер 1 (см)", min_value=10, step=10, key="size1")
    st.number_input("Размер 2 (см)", min_value=10, step=10, key="size2")

    size1 = st.session_state.size1
    size2 = st.session_state.size2

    # ---------------------------
    # 🔒 ОГРАНИЧЕНИЕ 140
    # ---------------------------
    if size1 > 140 and size2 > 140:
        st.session_state.limit_warning_time = time.time()
        st.session_state.apply_size2 = 140
        st.rerun()

    # ---------------------------
    # 📏 SIZE 1 (кратность)
    # ---------------------------
    if size1 % 10 != 0:

        lower, upper = adjust_to_step(size1)

        st.warning("Размер 1 должен быть кратен 10")

        col1, col2 = st.columns(2)

        with col1:
            if st.button(f"{lower}", key="fix1_low", use_container_width=True):
                st.session_state.apply_size1 = lower
                st.rerun()

        with col2:
            if st.button(f"{upper}", key="fix1_up", use_container_width=True):
                st.session_state.apply_size1 = upper
                st.rerun()

        return

    # ---------------------------
    # 📏 SIZE 2 (кратность)
    # ---------------------------
    if size2 % 10 != 0:

        lower, upper = adjust_to_step(size2)

        st.warning("Размер 2 должен быть кратен 10")

        col1, col2 = st.columns(2)

        with col1:
            if st.button(f"{lower}", key="fix2_low", use_container_width=True):
                st.session_state.apply_size2 = lower
                st.rerun()

        with col2:
            if st.button(f"{upper}", key="fix2_up", use_container_width=True):
                st.session_state.apply_size2 = upper
                st.rerun()

        return

    # ---------------------------
    # 📊 КОНСТАНТЫ
    # ---------------------------
    FABRIC_PRICE = 540
    BRUS_PRICE = 34
    CROCODILE_PRICE = 5
    STAPLE_PRICE = 0.04
    MULTIPLIER = 6.75

    # ---------------------------
    # 📐 РАСЧЁТ
    # ---------------------------
    area_m2 = (size1 * size2) / 10000
    fabric_cost = area_m2 * FABRIC_PRICE

    perimeter_m = ((size1 + size2) * 2) / 100
    brus_cost = perimeter_m * BRUS_PRICE

    max_size = max(size1, size2)

    if max_size <= 65:
        complexity = 1
        work_cost = 50
        staples_qty = 5
    elif max_size <= 95:
        complexity = 2
        work_cost = 60
        staples_qty = 10
    else:
        complexity = 3
        work_cost = 80
        staples_qty = 20

    staples_cost = staples_qty * STAPLE_PRICE
    crocodile_cost = CROCODILE_PRICE

    cost_price = (
        fabric_cost +
        brus_cost +
        staples_cost +
        crocodile_cost +
        work_cost
    )

    final_price = cost_price * MULTIPLIER
    final_price_rounded = round_to_10(final_price)

    # ---------------------------
    # 💰 ВЫВОД
    # ---------------------------
    st.success(f"💰 Цена клиенту: {final_price_rounded} ₽")

    # ---------------------------
    # 📊 ДЕТАЛИ
    # ---------------------------
    if show_details:

        st.markdown("## 📊 Полный расчёт")

        st.write(f"{size1} × {size2} см")
        st.write(f"Площадь: {area_m2:.4f} м² → {fabric_cost:.2f} ₽")
        st.write(f"Периметр: {perimeter_m:.2f} м → {brus_cost:.2f} ₽")

        st.write(f"Сложность: {complexity} (по {max_size} см)")
        st.write(f"Работа: {work_cost} ₽")

        st.write(f"Скобы: {staples_qty} → {staples_cost:.2f} ₽")
        st.write(f"Крокодил: {crocodile_cost} ₽")

        st.write(f"Себестоимость: {cost_price:.2f} ₽")
        st.write(f"Финал: {final_price:.2f} → {final_price_rounded} ₽")


def register():
    return {
        "name": "Холсты",
        "render": canvas_page
    }