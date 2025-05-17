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

  // State for applications and loading status
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Define form steps for reference
  const FORMS = [
    { step: "client-details", label: "Client Details" },
    { step: "trading-as", label: "Trading As" },
    { step: "referrals", label: "Referrals" },
    { step: "associations", label: "Associations" },
    { step: "assignments", label: "Assignments" },
    { step: "kyc", label: "Know Your Client" },
    { step: "risk-assessment", label: "Risk Assessment" },
    { step: "non-audit", label: "Non-Audit Checklist" },
    { step: "finalise", label: "Finalise" },
  ];

  // Fetch all applications when the component mounts or when it gains focus
  useEffect(() => {
    // Only fetch applications when the component mounts or user changes
    if (user) {
      console.log('Current user:', user);
      fetchApplications();
    }
  }, [user]);

  // Function to fetch all applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      // Only fetch applications for the current user
      if (!user) {
        console.warn("No user available, cannot fetch applications");
        setApplications([]);
        setLoading(false);
        return;
      }
      
      // Get the user ID - it might be in different properties depending on the auth system
      const userId = user.id || user._id || user.userId || user.user_id;
      
      if (!userId) {
        console.warn("No user ID found in user object:", user);
        setApplications([]);
        setLoading(false);
        return;
      }
      
      console.log(`Fetching applications for user ID: ${userId}`);
      
      // Use the correct API endpoint with user filtering
      const res = await fetch(`http://localhost:8000/api/applications?user_id=${userId}`);
      
      if (!res.ok) {
        console.error("Failed to fetch applications:", res.status);
        setApplications([]);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log(`Fetched ${data.length} applications for user ${user.id}:`, data);
      
      // Fetch progress for each application - simplified approach
      const appsWithProgress = await Promise.all(
        data.map(async (app) => {
          try {
            // Make sure we have a valid app ID
            if (!app.id) {
              console.warn("Application has no ID");
              return { ...app, progress_percentage: 0, completed_forms: 0, total_forms: FORMS.length };
            }

            // Fetch progress for this application
            console.log(`Fetching progress for application ${app.id}`);
            const progressRes = await fetch(`http://localhost:8000/api/form-progress/all/${app.id}`, {
              // Add cache control to prevent browser caching
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            // Default to empty array if there's any issue
            let progressData = [];
            
            // Only try to parse the response if it's successful
            if (progressRes.ok) {
              try {
                progressData = await progressRes.json();
                console.log(`Progress for app ${app.id}:`, progressData);
              } catch (e) {
                console.warn(`Failed to parse progress data for app ${app.id}:`, e);
              }
            } else {
              console.warn(`Failed to fetch progress for app ${app.id}:`, progressRes.status);
            }
            
            // Enhanced progress calculation - count unique steps with actual saved data
            const formSteps = new Set();
            const formProgress = {};
            
            // Only process if we have valid array data
            if (Array.isArray(progressData)) {
              // Count each unique step and check if it has data
              progressData.forEach(item => {
                if (item && item.step) {
                  // Check if the form has actual data
                  const hasData = item.data && 
                    typeof item.data === 'object' && 
                    Object.keys(item.data).length > 0;
                  
                  // Add the step to our tracking
                  formSteps.add(item.step);
                  
                  // Record details about this form
                  formProgress[item.step] = {
                    lastUpdated: item.last_updated,
                    hasData: hasData,
                    dataSize: hasData ? Object.keys(item.data).length : 0
                  };
                  
                  // Log detailed form information
                  console.log(`Form ${item.step} for app ${app.id}: ${hasData ? 'Has data' : 'Empty'} (${hasData ? Object.keys(item.data).length : 0} fields)`);
                }
              });
            }
            
            const completedForms = formSteps.size;
            const progressPercentage = Math.round((completedForms / FORMS.length) * 100);
            
            console.log(`App ${app.id} progress: ${completedForms}/${FORMS.length} forms (${progressPercentage}%)`);
            console.log(`Completed steps: ${Array.from(formSteps).join(', ')}`);
            
            return { 
              ...app, 
              progress_percentage: progressPercentage,
              completed_forms: completedForms,
              total_forms: FORMS.length,
              completed_steps: Array.from(formSteps),
              form_details: formProgress
            };
          } catch (error) {
            console.error(`Error fetching progress for app ${app.id}:`, error);
            return { ...app, progress_percentage: 0, completed_forms: 0, total_forms: FORMS.length };
          }
        })
      );
      
      setApplications(appsWithProgress || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new application
  const createNewApplication = async () => {
    setLoading(true);
    try {
      if (!user) {
        console.error("Cannot create application: No user is logged in");
        setLoading(false);
        return;
      }
      
      // Get the user ID from wherever it's stored in the user object
      const userId = user.id || user._id || user.userId || user.user_id;
      
      if (!userId) {
        console.error("Cannot create application: No user ID found", user);
        setLoading(false);
        return;
      }
      
      console.log(`Creating new application for user ID: ${userId}`);
      
      const response = await fetch('http://localhost:8000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });
      
      console.log("Application creation response:", response.status);
      if (!response.ok) {
        console.error("Error creating application:", response.status, response.statusText);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      console.log("Created new application:", data);
      
      // Store the application ID in localStorage for form components to use
      localStorage.setItem('currentApplicationId', data.id);
      
      // Refresh the applications list to include the new one with progress info
      await fetchApplications();
      
      // Navigate to the first form of the new application
      navigate(`/onboarding/client-details/${data.id}`);
    } catch (err) {
      console.error("Error creating application:", err);
      setLoading(false);
    }
  };

  // Function to get application progress with improved error handling
  const getApplicationProgress = async (applicationId) => {
    try {
      // Make sure we have a valid application ID
      if (!applicationId) {
        console.warn("No application ID provided");
        return { count: 0, total: FORMS.length, percentage: 0 };
      }

      console.log(`Fetching progress for application ${applicationId}`);
      const response = await fetch(`http://localhost:8000/form-progress/all/${applicationId}`, {
        // Add cache control to prevent browser caching
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Handle any response status
      if (!response.ok) {
        console.warn(`Failed to fetch progress for application ${applicationId}: ${response.status}`);
        return { count: 0, total: FORMS.length, percentage: 0 };
      }
      
      // Parse the JSON response safely
      let progressData = [];
      try {
        progressData = await response.json();
        console.log(`Progress data for application ${applicationId}:`, progressData);
      } catch (e) {
        console.warn(`Failed to parse progress data for application ${applicationId}:`, e);
      }
      
      // Ensure progressData is an array
      if (!Array.isArray(progressData)) {
        console.warn(`Progress data is not an array for application ${applicationId}`);
        progressData = [];
      }
      
      // Get unique form steps from the progress data
      const completedSteps = new Set(progressData.map(item => item.step));
      const completedCount = completedSteps.size;
      
      // Calculate progress percentage based on unique form steps
      const percentage = Math.round((completedCount / FORMS.length) * 100);
      
      console.log(`Application ${applicationId} progress: ${completedCount}/${FORMS.length} (${percentage}%)`);
      
      // Return progress metrics
      return {
        count: completedCount,
        total: FORMS.length,
        percentage: percentage,
        data: progressData, // Store the actual data for debugging
        steps: Array.from(completedSteps) // Store the completed steps
      };
    } catch (error) {
      console.error(`Error fetching progress for application ${applicationId}:`, error);
      return { count: 0, total: FORMS.length, percentage: 0 };
    }
  };

  if (!user) {
    return <div>Please log in to view this page.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.email || 'User'} 👋</h1>
        <p className="text-gray-600">Client Onboarding Dashboard</p>
      </div>
      
      {/* Applications Header with Refresh and New Application buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800 mr-3">Your Onboarding Applications</h2>
          <button 
            onClick={() => fetchApplications()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-3 rounded flex items-center"
            title="Refresh applications"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <button 
          onClick={createNewApplication}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          New Onboarding Application
        </button>
      </div>

      <Card className="mt-4">
        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Your Onboarding Applications</h2>
          {loading ? (
            <p>Loading applications...</p>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No applications found</p>
              <Button 
                onClick={createNewApplication}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Your First Application
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left">Application ID</th>
                    <th className="py-2 px-4 text-left">Created Date</th>
                    <th className="py-2 px-4 text-left">Status</th>
                    <th className="py-2 px-4 text-left">Progress</th>
                    <th className="py-2 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{app.id.slice(0, 8)}...</td>
                      <td className="py-2 px-4">{new Date(app.created_at).toLocaleDateString()}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${app.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {app.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex items-center">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${app.progress_percentage || 0}%` }}
                              title={app.completed_steps?.join(', ') || 'No steps completed'}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {app.progress_percentage || 0}%
                            <small className="progress-detail">
                              ({app.completed_forms || 0}/{app.total_forms || 0} forms)
                            </small>
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            localStorage.setItem('currentApplicationId', app.id);
                            navigate(`/onboarding/client-details/${app.id}`);
                          }}
                        >
                          Continue
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={logout} className="mr-2">
          Logout
        </Button>
      </div>
    </div>
  );
}

export default Dashboard;