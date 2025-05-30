import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Provider } from "react-redux";
import { store } from "@/store";
import { UserProvider } from "@/context/UserContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>
);
