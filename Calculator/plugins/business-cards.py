import streamlit as st


def business_cards_page():

    st.subheader("🪪 Визитки")

    material = st.selectbox(
        "Материал",
        ["Бумага", "Полипропилен белый", "Полипропилен чёрный", "Алюминий"]
    )

    qty = int(st.number_input("Количество", min_value=10, step=1))

    sides = None
    unit_price = None

    # ---------------------------
    # 📄 БУМАГА
    # ---------------------------
    if material == "Бумага":

        method = st.selectbox("Метод печати", ["Оффсет", "Цифра", "УФ"])

        if method == "Оффсет":

            valid = [500] + list(range(1000, 20001, 1000))

            if qty not in valid:

                lower = max([v for v in valid if v < qty], default=500)
                upper = min([v for v in valid if v > qty], default=20000)

                st.warning("Тираж не подходит под оффсет. Выберите вариант:")

                choice = st.radio(
                    "Ближайшие варианты",
                    [f"{lower} (меньше)", f"{upper} (больше)"]
                )

                qty = lower if "меньше" in choice else upper

            # цены
            if qty == 500:
                unit_price = 4
            elif qty <= 1000:
                unit_price = 3
            elif qty <= 2000:
                unit_price = 1.6
            elif qty <= 3000:
                unit_price = 1.5
            elif qty <= 4000:
                unit_price = 1.4
            elif qty <= 5000:
                unit_price = 1.3
            else:
                unit_price = 1.2

        else:

            step = 10 if method == "Цифра" else 12
            sides = st.selectbox("Стороны", ["1 сторона", "2 стороны"])

            if qty < 48:
                st.warning("Минимум 48")

                lower = 48
                upper = 60

                choice = st.radio(
                    "Ближайшие варианты",
                    [f"{lower}", f"{upper}"]
                )

                qty = int(choice)

            elif qty % step != 0:

                lower = (qty // step) * step
                upper = lower + step

                st.warning(f"Тираж должен быть кратен {step}. Выберите вариант:")

                choice = st.radio(
                    "Ближайшие варианты",
                    [f"{lower}", f"{upper}"]
                )

                qty = lower if choice.startswith(str(lower)) else upper

            if sides == "1 сторона":
                unit_price = 10 if qty <= 300 else 8
            else:
                unit_price = 15 if qty <= 300 else 12

    # ---------------------------
    # 🧴 ПОЛИПРОПИЛЕН БЕЛЫЙ
    # ---------------------------
    elif material == "Полипропилен белый":

        st.info("Метод печати: УФ печать")
        sides = st.selectbox("Стороны", ["1 сторона", "2 стороны"])

        if qty < 50:
            lower, upper = 50, 60

            st.warning("Минимум 50. Выберите вариант:")

            choice = st.radio(
                "Ближайшие варианты",
                [f"{lower}", f"{upper}"]
            )

            qty = int(choice)

        elif qty % 10 != 0:
            lower = (qty // 10) * 10
            upper = lower + 10

            st.warning("Кратно 10. Выберите вариант:")

            choice = st.radio(
                "Ближайшие варианты",
                [f"{lower}", f"{upper}"]
            )

            qty = lower if choice == f"{lower}" else upper

        if sides == "1 сторона":
            unit_price = 93 if qty <= 100 else 75 if qty <= 200 else 65 if qty <= 300 else 60 if qty <= 1000 else 55
        else:
            unit_price = 167 if qty <= 100 else 127 if qty <= 200 else 104 if qty <= 300 else 96 if qty <= 1000 else 70

    # ---------------------------
    # ⚫ ПОЛИПРОПИЛЕН ЧЁРНЫЙ
    # ---------------------------
    elif material == "Полипропилен чёрный":

        st.info("Метод печати: УФ печать")
        sides = st.selectbox("Стороны", ["1 сторона", "2 стороны"])

        if qty < 50:
            lower, upper = 50, 60

            st.warning("Минимум 50. Выберите вариант:")

            choice = st.radio(
                "Ближайшие варианты",
                [f"{lower}", f"{upper}"]
            )

            qty = int(choice)

        elif qty % 10 != 0:
            lower = (qty // 10) * 10
            upper = lower + 10

            st.warning("Кратно 10. Выберите вариант:")

            choice = st.radio(
                "Ближайшие варианты",
                [f"{lower}", f"{upper}"]
            )

            qty = lower if choice == f"{lower}" else upper

        if sides == "1 сторона":
            unit_price = 103 if qty <= 100 else 85 if qty <= 200 else 75 if qty <= 300 else 70 if qty <= 1000 else 65
        else:
            unit_price = 177 if qty <= 100 else 137 if qty <= 200 else 114 if qty <= 300 else 106 if qty <= 1000 else 80

    # ---------------------------
    # 🪙 АЛЮМИНИЙ
    # ---------------------------
    elif material == "Алюминий":

        st.info("Метод печати: УФ печать")

        if qty < 50:
            lower, upper = 50, 60

            st.warning("Минимум 50. Выберите вариант:")

            choice = st.radio(
                "Ближайшие варианты",
                [f"{lower}", f"{upper}"]
            )

            qty = int(choice)

        elif qty % 12 != 0:
            lower = (qty // 12) * 12
            upper = lower + 12

            st.warning("Кратно 12. Выберите вариант:")

            choice = st.radio(
                "Ближайшие варианты",
                [f"{lower}", f"{upper}"]
            )

            qty = lower if choice == f"{lower}" else upper

        if qty <= 100:
            unit_price = 250
        elif qty <= 200:
            unit_price = 232
        elif qty <= 300:
            unit_price = 214
        else:
            unit_price = 180

        sides = None

    # ---------------------------
    # 💰 ИТОГ
    # ---------------------------
    total = unit_price * qty

    st.success(f"{unit_price} ₽ / шт")
    st.success(f"{total:.2f} ₽ за тираж")

    st.write(f"Материал: {material}")
    st.write(f"Количество: {qty}")

    if sides:
        st.write(f"Стороны: {sides}")


def register():
    return {
        "name": "Визитки",
        "render": business_cards_page
    }