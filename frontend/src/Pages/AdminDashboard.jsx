// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/AuthStore';
import { getAllApplications, getAllUsers, getApplicationFormDetails, updateApplicationStatus } from "@/utils/api";
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


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsData, usersData] = await Promise.all([
          getAllApplications(),
          getAllUsers()
        ]);
        setApplications(appsData);
        setUsers(usersData);
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
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
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {users.length === 0 ? (
                  <p>No users found.</p>
                ) : (
                  users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm">{user.email}</p>
                          <p className="text-sm">Role: {user.role}</p>
                        </div>
                        <Button variant="outline" size="sm">View Details</Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog>
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
                    <Progress value={(formDetails.length / 4) * 100} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {formDetails.length} of 4 forms completed
                    </p>
                  </CardContent>
                </Card>

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
  );
}

export default AdminDashboard;