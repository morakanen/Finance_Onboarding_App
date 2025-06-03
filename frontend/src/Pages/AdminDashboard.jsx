// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/AuthStore';
import { 
  getAllApplications, 
  getAllUsers, 
  getApplicationFormDetails, 
  updateApplicationStatus,
  getApplicationRiskScore,
  getRiskCategories,
  getAllRiskAssessments,
  getApplicationDocuments,
  downloadDocument
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
  const [searchParams] = useSearchParams();
  const [openDialogs, setOpenDialogs] = useState({});
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formDetails, setFormDetails] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [riskCategories, setRiskCategories] = useState(null);
  const [documents, setDocuments] = useState([]);


  // Function to load application details
  const loadApplicationDetails = useCallback(async (applicationId) => {
    try {
      console.log('Loading details for application:', applicationId);
      console.log('Current applications:', applications);
      const app = applications.find(a => a.id === applicationId);
      console.log('Found application:', app);
      if (app) {
        setSelectedApp(app);
        const [details, docs] = await Promise.all([
          getApplicationFormDetails(applicationId),
          getApplicationDocuments(applicationId)
        ]);
        setFormDetails(details);
        setDocuments(docs);
        setOpenDialogs(prev => ({ ...prev, [applicationId]: true }));

        if (details.length > 0) {
          try {
            // Pass rule_weight=0.5 for equal weighting between rule-based and ML scoring
            // Get risk assessment data with 0.5 rule weight (50/50 balance)
            const riskData = await getApplicationRiskScore(applicationId, 0.5);
            console.log('Risk assessment loaded successfully:', riskData);
            
            // Transform the nested response structure to flat properties for UI display
            const formattedRiskData = {
              // Weighted score properties
              weighted_score: riskData.weighted?.score || 0,
              weighted_level: riskData.weighted?.level || 'low',
              weighted_factors: riskData.weighted?.factors || [],
              
              // Rule-based score properties
              rule_based_score: riskData.rule_based?.score || 0,
              rule_based_level: riskData.rule_based?.level || 'low',
              rule_based_factors: riskData.rule_based?.factors || [],
              
              // ML-based score properties
              ml_score: riskData.ml_based?.score || 0,
              ml_level: riskData.ml_based?.level || 'low',
              ml_factors: riskData.ml_based?.factors || [],
              
              // Other properties
              comments: riskData.comments || []
            };
            
            console.log('Formatted risk data for UI:', formattedRiskData);
            setRiskAssessment(formattedRiskData);
          } catch (riskErr) {
            console.error('Risk assessment failed but continuing:', riskErr);
            console.error('Error details:', riskErr.message);
          }
        }
      }
    } catch (err) {
      console.error('Error viewing details:', err);
      setError(err.message);
    }
  }, [applications, setSelectedApp, setFormDetails, setDocuments, setRiskAssessment, setError]);

  // Effect to handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const applicationId = params.get('application');
    const view = params.get('view');
    
    console.log('URL Parameters:', window.location.search);
    console.log('Parsed - application:', applicationId, 'view:', view);
    console.log('Current applications:', applications);
    
    if (applicationId && view === 'details' && applications.length > 0) {
      console.log('Attempting to open dialog for application:', applicationId);
      const app = applications.find(a => a.id === applicationId);
      console.log('Found application:', app);
      if (app) {
        loadApplicationDetails(applicationId);
      }
    }
  }, [searchParams, applications, loadApplicationDetails]);

  // Effect to load initial data
  useEffect(() => {
    console.log('Loading initial data...');
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
                        <Dialog 
                          open={openDialogs[app.id] || false} 
                          onOpenChange={(open) => setOpenDialogs(prev => ({ ...prev, [app.id]: open }))}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => loadApplicationDetails(app.id)}
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

                                  {/* Documents Card */}
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Uploaded Documents</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      {documents.length === 0 ? (
                                        <p className="text-muted-foreground">No documents uploaded yet.</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                              <span className="text-sm truncate max-w-[300px]">{doc.name}</span>
                                              <div className="space-x-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => window.open(doc.url, '_blank')}
                                                >
                                                  View
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={async () => {
                                                    try {
                                                      await downloadDocument(selectedApp.id, doc.id, doc.name);
                                                    } catch (err) {
                                                      console.error('Error downloading:', err);
                                                      setError('Failed to download document');
                                                    }
                                                  }}
                                                >
                                                  Download
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
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
                                          <div className="space-y-6">
                                            {/* Weighted risk score */}
                                            <div>
                                              <h4 className="text-sm font-semibold mb-3">Weighted Assessment</h4>
                                              <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium">Combined Risk Score</span>
                                                <span className="text-sm font-bold">{riskAssessment.weighted_score || 0}/100</span>
                                              </div>
                                              <Progress 
                                                value={riskAssessment.weighted_score || 0} 
                                                className="w-full h-3"
                                                indicatorClassName={`${riskAssessment.weighted_level === 'high' ? 'bg-red-500' : riskAssessment.weighted_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                              />
                                              <p className="text-xs text-gray-500 mt-1">Combined rule-based and ML analysis</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                              {/* Rule-based risk score */}
                                              <div>
                                                <h4 className="text-sm font-semibold mb-2">Rule-Based Assessment</h4>
                                                <div className="flex justify-between items-center mb-2">
                                                  <span className="text-sm font-medium">Score</span>
                                                  <span className="text-sm font-bold">{riskAssessment.rule_based_score}/100</span>
                                                </div>
                                                <Progress 
                                                  value={riskAssessment.rule_based_score} 
                                                  className="w-full"
                                                  indicatorClassName={`${riskAssessment.rule_based_level === 'high' ? 'bg-red-500' : riskAssessment.rule_based_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                />
                                              </div>
                                              
                                              {/* ML-based risk score */}
                                              {riskAssessment.ml_score !== null && (
                                                <div>
                                                  <h4 className="text-sm font-semibold mb-2">ML Model Assessment</h4>
                                                  <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium">Score</span>
                                                    <span className="text-sm font-bold">{riskAssessment.ml_score}/100</span>
                                                  </div>
                                                  <Progress 
                                                    value={riskAssessment.ml_score} 
                                                    className="w-full"
                                                    indicatorClassName={`${riskAssessment.ml_level === 'high' ? 'bg-red-500' : riskAssessment.ml_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Rule-based risk factors */}
                                            {riskAssessment.rule_based_factors && riskAssessment.rule_based_factors.length > 0 && (
                                              <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2">Rule-Based Risk Factors</h4>
                                                <ul className="space-y-2">
                                                  {riskAssessment.rule_based_factors.map((factor, index) => (
                                                    <li key={index} className="text-sm p-2 border rounded bg-muted/20">
                                                      <span 
                                                        className="inline-block w-2 h-2 rounded-full mr-2"
                                                        style={{
                                                          backgroundColor: factor.impact === 'high' ? '#EF4444' : 
                                                                          factor.impact === 'medium' ? '#F59E0B' : '#10B981'
                                                        }}
                                                      />
                                                      <strong>{factor.name}</strong>
                                                      <p className="mt-1 text-xs text-muted-foreground">{factor.description}</p>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            
                                            {/* ML-based risk factors */}
                                            {riskAssessment.ml_factors && riskAssessment.ml_factors.length > 0 && (
                                              <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2">ML Model Risk Factors</h4>
                                                <ul className="space-y-2">
                                                  {riskAssessment.ml_factors.map((factor, index) => (
                                                    <li key={index} className="text-sm p-2 border rounded bg-muted/20">
                                                      <span 
                                                        className="inline-block w-2 h-2 rounded-full mr-2"
                                                        style={{
                                                          backgroundColor: factor.impact === 'high' ? '#EF4444' : 
                                                                          factor.impact === 'medium' ? '#F59E0B' : '#10B981'
                                                        }}
                                                      />
                                                      <strong>{factor.name}</strong>
                                                      <p className="mt-1 text-xs text-muted-foreground">{factor.description}</p>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            
                                            {/* Comments section */}
                                            {riskAssessment.comments && riskAssessment.comments.length > 0 && (
                                              <div className="mt-4">
                                                <h4 className="text-sm font-semibold mb-2">Additional Comments</h4>
                                                <ul className="space-y-2">
                                                  {riskAssessment.comments.map((comment, index) => (
                                                    <li key={index} className="text-sm p-2 border rounded bg-muted/20">
                                                      {comment}
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