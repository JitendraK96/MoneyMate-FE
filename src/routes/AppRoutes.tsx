import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../pages/dashboard";
import Signin from "@/pages/signin";
import Signup from "@/pages/signup";
import EmiDetails from "@/pages/emidetails";
import EmiListing from "@/pages/emitracker/emilistings";

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
        <Route index element={<>Overview</>} />
        <Route path="overview" element={<>Overview</>} />
        <Route path="goals" element={<>Goals</>} />
        <Route path="emitracker" element={<EmiListing />} />
        <Route path="emitracker/create" element={<EmiDetails />} />
        <Route path="emitracker/:id" element={<EmiDetails />} />
        <Route path="reminders" element={<>Reminders</>} />
      </Route>

      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  );
};

export default AppRoutes;
