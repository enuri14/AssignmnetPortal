import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import AssignmentsPage from "./components/AssignmentsPage.tsx";
import AssignmentDetailsPage from "./components/AssignmentDetailsPage.tsx";


const App: React.FC = () => {
  return (
    <div className="app-root">
      <header className="top-bar">
        <div className="logo-area">
          <span className="brand-name">
            Assignment<span>Hub</span>
          </span>
        </div>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Assignments
          </NavLink>
        </nav>
        <div className="user-area">
          <button className="control-btn">Control Panel</button>
        </div>
      </header>

      <main className="page-container">
        <Routes>
          <Route path="/" element={<AssignmentsPage />} />
          <Route path="/assignments/:id" element={<AssignmentDetailsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
