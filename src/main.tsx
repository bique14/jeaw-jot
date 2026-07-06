import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./i18n";
import "./index.css";
import App from "./App";

// Init dark mode before first paint to avoid flash
const _stored = localStorage.getItem("jeaw-dark-mode");
const _dark =
  _stored !== null
    ? _stored === "1"
    : window.matchMedia("(prefers-color-scheme: dark)").matches;
if (_dark) document.documentElement.classList.add("dark");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
