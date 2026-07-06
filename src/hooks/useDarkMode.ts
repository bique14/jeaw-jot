import { useEffect, useState } from "react";

const STORAGE_KEY = "jeaw-dark-mode";

/** Returns true if system prefers dark */
function getSystemPref(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "1";
    return getSystemPref();
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, dark ? "1" : "0");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}
