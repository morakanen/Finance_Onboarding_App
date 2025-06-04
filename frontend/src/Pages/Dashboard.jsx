import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/AuthStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

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

  // Fetch all applications when the component mounts or when user changes
  useEffect(() => {
    if (user) {
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

      // Get the user ID - it might be in different properties
      const userId = user.id || user._id || user.userId || user.user_id;
      if (!userId) {
        console.warn("No user ID found in user object:", user);
        setApplications([]);
        setLoading(false);
        return;
      }

      console.log(`Fetching applications for user ID: ${userId}`);
      const res = await fetch(
        `http://localhost:8000/api/applications?user_id=${userId}`
      );

      if (!res.ok) {
        console.error("Failed to fetch applications:", res.status);
        setApplications([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log(
        `Fetched ${data.length} applications for user ${userId}:`,
        data
      );

      // Fetch progress for each application
      const appsWithProgress = await Promise.all(
        data.map(async (app) => {
          try {
            if (!app.id) {
              console.warn("Application has no ID");
              return {
                ...app,
                progress_percentage: 0,
                completed_forms: 0,
                total_forms: FORMS.length,
              };
            }

            console.log(`Fetching progress for application ${app.id}`);
            const progressRes = await fetch(
              `http://localhost:8000/api/form-progress/all/${app.id}`,
              {
                headers: {
                  "Cache-Control": "no-cache",
                  Pragma: "no-cache",
                },
              }
            );

            let progressData = [];
            if (progressRes.ok) {
              try {
                progressData = await progressRes.json();
                console.log(`Progress for app ${app.id}:`, progressData);
              } catch (e) {
                console.warn(
                  `Failed to parse progress data for app ${app.id}:`,
                  e
                );
              }
            } else {
              console.warn(
                `Failed to fetch progress for app ${app.id}:`,
                progressRes.status
              );
            }

            // Enhanced progress calculation
            const formSteps = new Set();
            const formProgress = {};

            if (Array.isArray(progressData)) {
              progressData.forEach((item) => {
                if (item && item.step) {
                  // Consider a step completed if it has any data or is marked as completed
                  const hasData =
                    item.data &&
                    typeof item.data === "object" &&
                    Object.keys(item.data).length > 0;
                  
                  // Also check for a completed flag if it exists
                  const isCompleted = item.completed || item.is_completed || false;
                  
                  // Add to completed steps if it has data or is explicitly marked as completed
                  if (hasData || isCompleted) {
                    formSteps.add(item.step);
                    formProgress[item.step] = {
                      lastUpdated: item.last_updated,
                      hasData: hasData,
                      isCompleted: isCompleted,
                      dataSize: hasData ? Object.keys(item.data).length : 0,
                    };
                    
                    console.log(
                      `Form ${item.step} for app ${app.id}: ${
                        hasData ? "Has data" : "Empty"
                      } (${
                        hasData ? Object.keys(item.data).length : 0
                      } fields) - ${isCompleted ? "Completed" : "In Progress"}`
                    );
                  }
                }
              });
            }

            const completedForms = formSteps.size;
            const progressPercentage = Math.round(
              (completedForms / FORMS.length) * 100
            );

            console.log(
              `App ${app.id} progress: ${completedForms}/${FORMS.length} forms (${progressPercentage}%)`
            );
            console.log(
              `Completed steps: ${Array.from(formSteps).join(", ")}`
            );

            return {
              ...app,
              progress_percentage: progressPercentage,
              completed_forms: completedForms,
              total_forms: FORMS.length,
              completed_steps: Array.from(formSteps),
              form_details: formProgress,
            };
          } catch (error) {
            console.error(`Error fetching progress for app ${app.id}:`, error);
            return {
              ...app,
              progress_percentage: 0,
              completed_forms: 0,
              total_forms: FORMS.length,
            };
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

      const userId = user.id || user._id || user.userId || user.user_id;
      if (!userId) {
        console.error("Cannot create application: No user ID found", user);
        setLoading(false);
        return;
      }

      console.log(`Creating new application for user ID: ${userId}`);
      const response = await fetch("http://localhost:8000/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      console.log("Application creation response:", response.status);
      if (!response.ok) {
        throw new Error(
          `Error creating application: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Created new application:", data);

      // Store the new application ID in localStorage
      localStorage.setItem("currentApplicationId", data.id);

      // Refresh the applications list
      await fetchApplications();

      // Navigate to the first form of the new application
      navigate(`/onboarding/client-details/${data.id}`);
    } catch (err) {
      console.error("Error creating application:", err);
    } finally {
      setLoading(false);
    }
  };

  // (Optional) If you still need a standalone progress fetcher elsewhere:
  const getApplicationProgress = async (applicationId) => {
    try {
      if (!applicationId) {
        console.warn("No application ID provided");
        return { count: 0, total: FORMS.length, percentage: 0 };
      }

      console.log(`Fetching progress for application ${applicationId}`);
      const response = await fetch(
        `http://localhost:8000/api/form-progress/all/${applicationId}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        console.warn(
          `Failed to fetch progress for application ${applicationId}: ${response.status}`
        );
        return { count: 0, total: FORMS.length, percentage: 0 };
      }

      let progressData = [];
      try {
        progressData = await response.json();
        console.log(
          `Progress data for application ${applicationId}:`,
          progressData
        );
      } catch (e) {
        console.warn(
          `Failed to parse progress data for application ${applicationId}:`,
          e
        );
      }

      if (!Array.isArray(progressData)) {
        console.warn(
          `Progress data is not an array for application ${applicationId}`
        );
        progressData = [];
      }

      const completedSteps = new Set(progressData.map((item) => item.step));
      const completedCount = completedSteps.size;
      const percentage = Math.round((completedCount / FORMS.length) * 100);

      console.log(
        `Application ${applicationId} progress: ${completedCount}/${FORMS.length} (${percentage}%)`
      );

      return {
        count: completedCount,
        total: FORMS.length,
        percentage,
        data: progressData,
        steps: Array.from(completedSteps),
      };
    } catch (error) {
      console.error(
        `Error fetching progress for application ${applicationId}:`,
        error
      );
      return { count: 0, total: FORMS.length, percentage: 0 };
    }
  };

  // If the user is not logged in, show an authentication prompt
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-[calc(100vh-4rem)] bg-zinc-900/50"
      >
        <Card className="w-96 bg-zinc-800 text-white border-zinc-700 shadow-xl">
          <CardContent className="p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-orange-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V6a3 3 0 00-3-3H9m1.5-1H9m12 0H9m12 0A20.99 20.99 0 0121 12M3 12a20.99 20.99 0 019-16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold mb-2"
            >
              Authentication Required
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-zinc-400 mb-6"
            >
              Please log in to view your dashboard
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={() => navigate("/auth")}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
              >
                Go to Login
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto p-4 pt-6 pb-16 min-h-[calc(100vh-4rem)]"
    >
      {/* Welcome Header */}
      <motion.div
        variants={itemVariants}
        className="mb-8 bg-gradient-to-r from-zinc-900 to-zinc-800 p-6 rounded-xl shadow-xl border border-zinc-700/50"
      >
        <motion.h1
          className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600 mb-2"
        >
          Welcome, {user?.email || "User"} 👋
        </motion.h1>
        <motion.p className="text-zinc-400">
          Client Onboarding Dashboard
        </motion.p>
      </motion.div>

      {/* Applications Header with Refresh and New Application buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
      >
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-white mr-3">
            Your Onboarding Applications
          </h2>
          <Button
            onClick={fetchApplications}
            variant="outline"
            size="sm"
            className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-orange-500 transition-all duration-300 flex items-center gap-2"
            disabled={loading}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582M20 20v-5h-.581M5.018 19.995A16.003 16.003 0 014 12c0-4.418 1.791-8.418 4.692-11.306m11.296 0A16.003 16.003 0 0120 12c0 4.418-1.791 8.418-4.692 11.306M8 7l-3-3m11 0l3 3"
              />
            </motion.svg>
            {loading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
        <Button
          onClick={createNewApplication}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2 w-full md:w-auto"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </motion.svg>
          New Onboarding Application
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="border-zinc-700/50 bg-zinc-800/50 backdrop-blur-sm shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="flex flex-col items-center">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-orange-500 animate-spin mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </motion.svg>
                  <p className="text-zinc-400">Loading your applications...</p>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="bg-zinc-900/50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </motion.svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No applications yet
                </h3>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Start your first onboarding application to begin the process
                </p>
                <Button
                  onClick={createNewApplication}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-2 px-6 rounded-md transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2 mx-auto"
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </motion.svg>
                  Create Your First Application
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-900/70">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Application ID
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Created Date
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700/50">
                    {applications.map((app, index) => (
                      <motion.tr
                        key={app.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="hover:bg-zinc-700/20 transition-colors duration-150"
                      >
                        <td className="py-4 px-4 text-sm text-zinc-300 font-mono">
                          <div className="break-all">
                            <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent font-medium">
                              {app.id}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-zinc-300">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          {app.status === "completed" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/20">
                              <motion.svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3 h-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2l4 -4"
                                />
                              </motion.svg>
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-500/20">
                              <motion.svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3 h-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3"
                                />
                              </motion.svg>
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="group relative w-32 bg-zinc-700/50 rounded-full h-2 overflow-hidden cursor-pointer">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${app.progress_percentage || 0}%`,
                                }}
                                transition={{
                                  delay: 0.2 + 0.05 * index,
                                  duration: 0.8,
                                  ease: "easeOut",
                                }}
                                className={`h-full rounded-full ${
                                  app.progress_percentage > 0 
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600" 
                                    : "bg-zinc-600"
                                }`}
                              />
                              {/* Tooltip to show completed steps */}
                              <div className="absolute left-0 -top-24 bg-zinc-800 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-zinc-700 z-10 w-48">
                                <p className="font-medium mb-1">Completed Sections:</p>
                                {app.completed_steps && app.completed_steps.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1">
                                    {app.completed_steps.map(step => {
                                      const formInfo = FORMS.find(form => form.step === step);
                                      return (
                                        <li key={step} className="text-green-400">
                                          {formInfo ? formInfo.label : step}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                ) : (
                                  <p className="text-zinc-400 italic">No sections completed yet</p>
                                )}
                              </div>
                            </div>
                            <span className="text-zinc-300 text-sm">
                              <span className={app.progress_percentage > 0 ? "text-orange-500 font-medium" : "text-zinc-500"}>
                                {app.progress_percentage || 0}%
                              </span>
                              <span className="text-zinc-500 text-xs ml-1">
                                ({app.completed_forms || 0}/{app.total_forms || 0})
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            onClick={() => {
                              localStorage.setItem(
                                "currentApplicationId",
                                app.id
                              );
                              navigate(`/onboarding/client-details/${app.id}`);
                            }}
                            className={`text-white font-medium py-1 px-3 rounded-md transition-all duration-300 hover:shadow-lg text-sm flex items-center gap-1 ${
                              app.status === "completed" 
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-blue-500/20" 
                                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-orange-500/20"
                            }`}
                            size="sm"
                          >
                            {app.status === "completed" ? "Redo" : "Continue"}
                            <motion.svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              {app.status === "completed" ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              )}
                            </motion.svg>
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={logout}
          className="border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-orange-500 transition-all duration-300"
        >
          Logout
        </Button>
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;
