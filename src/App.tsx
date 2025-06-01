import AppRoutes from "./routes/AppRoutes";
import "./App.css";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster richColors />
      <AppRoutes />
    </>
  );
}

export default App;
