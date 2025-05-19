// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/AuthStore';
import { 
  getAllApplications, 
  getAllUsers, 
  getApplicationFormDetails, 
  updateApplicationStatus,
  getApplicationRiskScore,
  getRiskCategories,
  getAllRiskAssessments
} from "@/utils/api";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';

function AdminDashboard() {
  const { user, role, logout } = useAuthStore();
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formDetails, setFormDetails] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskCategories, setRiskCategories] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsData, usersData, categories] = await Promise.all([
          getAllApplications(),
          getAllUsers(),
          getRiskCategories()
        ]);
        setApplications(appsData);
        setUsers(usersData);
        setRiskCategories(categories);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (!user) {
    return <p className="text-center mt-8">You need to be logged in to view this page.</p>;
  }

  if (role !== "admin") {
    return <p className="text-center mt-8">You do not have permission to access this page.</p>;
  }

  if (loading) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  if (error) {
    return <p className="text-center mt-8 text-red-500">Error: {error}</p>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {applications.length === 0 ? (
                  <p>No applications found.</p>
                ) : (
                  applications.map((app) => (
                    <Card key={app.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">Application ID: {app.id}</h3>
                          <p className="text-sm">Status: {app.status}</p>
                          <p className="text-sm">Created: {new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                try {
                                  console.log('Fetching details for application:', app.id);
                                  setSelectedApp(app);
                                  // Reset any previous risk assessment data
                                  setRiskAssessment(null);
                                  
                                  // Fetch both form details and risk assessment in parallel
                                  const details = await getApplicationFormDetails(app.id);
                                  setFormDetails(details);

                                  // Check if all 9 forms are completed
                                  if (details.length === 9 && app.status !== 'completed') {
                                    await updateApplicationStatus(app.id, 'completed');
                                    // Update the application in the applications list
                                    setApplications(prevApps =>
                                      prevApps.map(a =>
                                        a.id === app.id ? { ...a, status: 'completed' } : a
                                      )
                                    );
                                  }

                                  // Only fetch risk assessment if we have some form data
                                  if (details.length > 0) {
                                    try {
                                      const riskData = await getApplicationRiskScore(app.id);
                                      setRiskAssessment(riskData);
                                    } catch (riskErr) {
                                      console.warn('Risk assessment failed but continuing:', riskErr);
                                      // Non-critical error, don't prevent showing the dialog
                                    }
                                  }
                                } catch (err) {
                                  console.error('Error viewing details:', err);
                                  setError(err.message);
                                }
                              }}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details</DialogTitle>
                            </DialogHeader>
                            {error && <p className="text-red-500 p-4">{error}</p>}
                            {selectedApp && formDetails && (
                              <div className="space-y-4">
                                <div className="grid gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Application Overview</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <p><strong>Application ID:</strong> {selectedApp.id}</p>
                                      <p><strong>Status:</strong> {selectedApp.status}</p>
                                      <p><strong>Created:</strong> {new Date(selectedApp.created_at).toLocaleDateString()}</p>
                                    </CardContent>
                                  </Card>

                                  {/* Calculate total progress */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Overall Progress</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <Progress value={(formDetails.length / 9) * 100} className="w-full" />
                                      <p className="text-sm text-muted-foreground mt-2">
                                        {formDetails.length} of 9 forms completed
                                      </p>
                                    </CardContent>
                                  </Card>

                                  {/* Risk Assessment Card */}
                                  {formDetails.length > 0 && (
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                          <span>Risk Assessment</span>
                                          {riskAssessment && (
                                            <span
                                              className="px-3 py-1 text-sm font-medium rounded-full"
                                              style={{
                                                backgroundColor: riskCategories?.[riskAssessment.risk_label]?.color + '20',
                                                color: riskCategories?.[riskAssessment.risk_label]?.color,
                                                border: `1px solid ${riskCategories?.[riskAssessment.risk_label]?.color}`,
                                              }}
                                            >
                                              {riskAssessment.risk_label} Risk
                                            </span>
                                          )}
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        {riskAssessment ? (
                                          <div className="space-y-4">
                                            <div>
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium">Risk Score</span>
                                                <span className="text-sm font-bold">{riskAssessment.risk_score}/100</span>
                                              </div>
                                              <Progress 
                                                value={riskAssessment.risk_score} 
                                                className="w-full"
                                                indicatorClassName={`${riskAssessment.risk_label === 'High' ? 'bg-red-500' : riskAssessment.risk_label === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                              />
                                            </div>
                                            
                                            {riskAssessment.risk_factors && riskAssessment.risk_factors.length > 0 && (
                                              <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2">Risk Factors</h4>
                                                <ul className="space-y-2">
                                                  {riskAssessment.risk_factors.map((factor, index) => (
                                                    <li key={index} className="text-sm p-2 border rounded bg-muted/20">
                                                      <span 
                                                        className="inline-block w-2 h-2 rounded-full mr-2"
                                                        style={{
                                                          backgroundColor: factor.severity === 'high' ? '#EF4444' : 
                                                                          factor.severity === 'medium' ? '#F59E0B' : '#10B981'
                                                        }}
                                                      />
                                                      {factor.description}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            
                                            <div className="text-xs text-muted-foreground mt-2">
                                              Scoring method: {riskAssessment.scoring_method === 'machine_learning' ? 
                                                'Machine Learning' : 'Rule-based assessment'}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="py-4 text-center">
                                            <p className="text-sm text-muted-foreground">Loading risk assessment...</p>
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  )}

                                  {/* Form Details */}
                                  {formDetails.map((form) => {
                                    const formProgress = Object.keys(form.data || {}).length > 0 ? 100 : 0;
                                    return (
                                      <Card key={form.id}>
                                        <CardHeader className="pb-2">
                                          <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">
                                              {form.step.split('_').map(word => 
                                                word.charAt(0).toUpperCase() + word.slice(1)
                                              ).join(' ')}
                                            </CardTitle>
                                            <span className={`px-2 py-1 rounded text-sm ${formProgress === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                              {formProgress === 100 ? 'Completed' : 'In Progress'}
                                            </span>
                                          </div>
                                          <Progress value={formProgress} className="mt-2" />
                                        </CardHeader>
                                        <CardContent>
                                          <div className="grid gap-3">
                                            {Object.entries(form.data || {}).map(([key, value]) => (
                                              <div key={key} className="border rounded-lg p-3 bg-muted/20">
                                                <div className="font-medium mb-1">
                                                  {key.split('_').map(word => 
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                  ).join(' ')}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()}
                                                </div>
                                              </div>
                                            ))}
                                            {Object.keys(form.data || {}).length === 0 && (
                                              <p className="text-sm text-muted-foreground">No data submitted yet</p>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto font-medium">{user.role}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-red-600">High Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {applications.filter(app => app.risk_score >= 75).length}
                          </div>
                          <p className="text-sm text-muted-foreground">Applications</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-amber-600">Medium Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {applications.filter(app => app.risk_score >= 50 && app.risk_score < 75).length}
                          </div>
                          <p className="text-sm text-muted-foreground">Applications</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-green-600">Low Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {applications.filter(app => app.risk_score < 50).length}
                          </div>
                          <p className="text-sm text-muted-foreground">Applications</p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p>No applications found.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Risk Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications
                      .filter(app => app.risk_score !== undefined)
                      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                      .slice(0, 5)
                      .map(app => (
                        <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">Application {app.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(app.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
                                app.risk_score >= 75
                                  ? 'bg-red-100 text-red-800'
                                  : app.risk_score >= 50
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {app.risk_score >= 75
                                ? 'High Risk'
                                : app.risk_score >= 50
                                ? 'Medium Risk'
                                : 'Low Risk'}
                            </span>
                            <span className="text-sm font-medium">{app.risk_score}%</span>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p>No risk assessments found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}

export default AdminDashboard;