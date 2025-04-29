import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../pages/dashboard";
import Signin from "@/pages/signin";
import Signup from "@/pages/signup";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<>Home</>} />
        <Route path="expenses" element={<>Expenses</>} />
        <Route path="goals" element={<>Goals</>} />
      </Route>

      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  );
};

export default AppRoutes;
