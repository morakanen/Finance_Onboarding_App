// src/Pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/AuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Onboarding form progress logic
  const FORMS = [
    { step: "client-details", label: "Client Details" },
    { step: "trading-as", label: "Trading As" },
    { step: "referrals", label: "Referrals" },
    { step: "risk-assessment", label: "Risk Assessment" },
    { step: "non-audit", label: "Non-Audit Checklist" },
    { step: "finalise", label: "Finalise" },
  ];
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  // State to track the current application ID
  const [currentApplicationId, setCurrentApplicationId] = useState(null);

  // Create a new application when the component mounts
  useEffect(() => {
    if (user) {
      // For now, we'll just create a new application ID locally
      // In a real app, you'd call an API to create a new application in the database
      const newAppId = uuidv4();
      setCurrentApplicationId(newAppId);
      setLoading(false);
    }
  }, [user]);

  // Fetch form progress for the current application
  useEffect(() => {
    if (user && currentApplicationId) {
      // Now we're using the application ID instead of user ID
      axios.get(`/api/form-progress/all/${currentApplicationId}`)
        .then((response) => {
          setProgress(response.data || []);
        })
        .catch((err) => {
          console.error("Error fetching progress:", err);
          setProgress([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, currentApplicationId]);

  const progressMap = Object.fromEntries(progress.map(p => [p.step, p]));
  const completedCount = FORMS.filter(f => progressMap[f.step] && progressMap[f.step].data && Object.values(progressMap[f.step].data).some(v => v)).length;

  if (!user) {
    return <p>You need to be logged in to view this page.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.email} 👋</h1>
      <p className="text-gray-600">Client Dashboard</p>

      <Card className="mt-4">
        <CardContent>
          <h2 className="text-lg font-semibold">Onboarding Progress</h2>
          {loading ? (
            <p>Loading progress...</p>
          ) : (
            <>
              <div className="my-4 w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / FORMS.length) * 100}%` }}
                />
              </div>
              <ul className="mt-3 space-y-2">
                {FORMS.map((form) => (
                  <li
                    key={form.step}
                    className={`flex justify-between items-center p-3 border rounded-lg ${progressMap[form.step] ? "bg-green-50" : "bg-white"}`}
                  >
                    <div>
                      <p className="font-medium">{form.label}</p>
                      <p className="text-sm text-gray-500">
                        {progressMap[form.step] ? "Saved" : "Not started"}
                      </p>
                    </div>
                    <Button
  variant="outline"
  onClick={() => {
    // Use the applicationId from progressMap if editing, or use the current application ID
    let appId = progressMap[form.step]?.application_id || currentApplicationId;
    navigate(`/onboarding/${form.step}/${appId}`);
  }}
>
  {progressMap[form.step] ? "Edit" : "Start"}
</Button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Removed 'Your Applications' section due to undefined 'applications' variable and focus on onboarding progress */}
      {/*
      <Card className="mt-4">
        <CardContent>
          <h2 className="text-lg font-semibold">Your Applications</h2>
          {loading ? (
            <p>Loading applications...</p>
          ) : (
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
          )}
        </CardContent>
      </Card>
      */}

      <Button className="mt-4 w-full bg-red-500" onClick={logout}>
        Logout
      </Button>
    </div>
  );
}

export default Dashboard;