import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if (localStorage.getItem("accessibility-mode") === "true") {
  document.documentElement.classList.add("accessibility-mode");
}

createRoot(document.getElementById("root")!).render(<App />);
