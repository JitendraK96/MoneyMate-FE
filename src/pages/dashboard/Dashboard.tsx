import { Link, Outlet } from "react-router-dom";

export default function DashboardLayout() {
  console.log("DashboardLayout");
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <nav>
          <ul>
            <li>
              <Link to="/dashboard">Home</Link>
            </li>
            <li>
              <Link to="/dashboard/expenses">Expenses</Link>
            </li>
            <li>
              <Link to="/dashboard/goals">Goals</Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
