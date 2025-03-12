// src/Pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/AuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch(`/api/applications?userId=${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          setApplications(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching applications:", err);
          setLoading(false);
        });
    }
  }, [user]);

  if (!user) {
    return <p>You need to be logged in to view this page.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.email} 👋</h1>
      <p className="text-gray-600">Client Dashboard</p>

      <Card className="mt-4">
        <CardContent>
          <h2 className="text-lg font-semibold">Your Applications</h2>
          {loading ? (
            <p>Loading applications...</p>
          ) : applications.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {applications.map((app) => (
                <li key={app.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{app.form_section}</p>
                    <p className="text-sm text-gray-500">Status: {app.status}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/onboarding/${app.id}`)}
                  >
                    Continue
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-3">No applications started.</p>
          )}
        </CardContent>
      </Card>

      {/* ✅ Updated button to navigate to client-details */}
      <Button className="mt-4 w-full" onClick={() => navigate("/onboarding/client-details")}>
        Start New Application
      </Button>

      <Button className="mt-4 w-full bg-red-500" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}

export default Dashboard;