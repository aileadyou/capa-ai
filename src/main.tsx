import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getInitialTheme } from "@/lib/theme";
import { applyCustomization } from "@/lib/customization";

applyTheme(getInitialTheme());
applyCustomization();

createRoot(document.getElementById("root")!).render(<App />);
