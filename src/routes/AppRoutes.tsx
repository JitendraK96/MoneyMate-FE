import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../pages/dashboard";
import Signin from "@/pages/signin";
import Signup from "@/pages/signup";
import EmiListing from "@/pages/emitracker/emilistings";
import Uploadstatement from "@/pages/upload/uploadstatement";
import EMIDetails from "@/pages/emitracker/details";
import ReminderDetails from "@/pages/reminder/details";
import ReminderListing from "@/pages/reminder/listings";
import BorrowingDetails from "@/pages/borrowing/details";
import BorrowingListing from "@/pages/borrowing/listings";
import GoalDetails from "@/pages/goals/details";
import GoalsListing from "@/pages/goals/listings";

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
        <Route path="goals" element={<GoalsListing />} />
        <Route path="goals/create" element={<GoalDetails />} />
        <Route path="goals/:id" element={<GoalDetails />} />
        <Route path="emitracker" element={<EmiListing />} />
        <Route path="emitracker/create" element={<EMIDetails />} />
        <Route path="emitracker/:id" element={<EMIDetails />} />
        <Route path="reminders" element={<ReminderListing />} />
        <Route path="reminders/create" element={<ReminderDetails />} />
        <Route path="reminders/:id" element={<ReminderDetails />} />
        <Route path="uploadstatement" element={<Uploadstatement />} />
        <Route path="borrowing" element={<BorrowingListing />} />
        <Route path="borrowing/:id" element={<BorrowingDetails />} />
        <Route path="borrowing/create" element={<BorrowingDetails />} />
      </Route>

      <Route path="*" element={<Navigate to="/signin" />} />
    </Routes>
  );
};

export default AppRoutes;
