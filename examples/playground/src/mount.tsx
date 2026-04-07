import { StrictMode, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

export function mountPage(page: ReactElement) {
  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Could not find #root.");
  }

  createRoot(container).render(<StrictMode>{page}</StrictMode>);
}
