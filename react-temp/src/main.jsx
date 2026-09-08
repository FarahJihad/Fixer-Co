import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop.jsx";

import "./index.css";

import App from "./App.jsx";

import {
  LanguageProvider,
} from "./context/LanguageContext.jsx";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <BrowserRouter>

      <ScrollToTop />

      <LanguageProvider>
        <App />
      </LanguageProvider>

    </BrowserRouter>
  </StrictMode>
);