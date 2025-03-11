// src/pages/AdminDashboard.jsx
import React from 'react';
import useAuthStore from '../store/AuthStore';

function AdminDashboard() {
  const { user, role, logout } = useAuthStore();

  if (!user) {
    return <p>You need to be logged in to view this page.</p>;
  }

  if (role !== "admin") {
    return <p>You do not have permission to access this page.</p>;
  }

  return (
    <div>
      <h1>Welcome Admin!</h1>
      <p>Admin Dashboard</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default AdminDashboard;