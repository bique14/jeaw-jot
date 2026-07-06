import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import th from "./th.json";
import en from "./en.json";

i18n.use(initReactI18next).init({
  resources: {
    th: { translation: th },
    en: { translation: en },
  },
  lng: localStorage.getItem("language") ?? "th",
  fallbackLng: "th",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("language", lng);
});

export default i18n;
