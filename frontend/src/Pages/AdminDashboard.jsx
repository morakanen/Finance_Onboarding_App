// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import useAuthStore from "../store/AuthStore";
import {
  getAllApplications,
  getAllUsers,
  getApplicationFormDetails,
  getApplicationRiskScore,
  getRiskCategories,
  getApplicationDocuments,
  downloadDocument,
  approveApplication,
} from "@/utils/api";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Calendar component removed
import { format } from "date-fns";
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ArrowUpDown,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  BarChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

function AdminDashboard() {
  const { user, role, logout } = useAuthStore();
  const [searchParams] = useSearchParams();

  const [openDialogs, setOpenDialogs] = useState({});
  const [approvingId, setApprovingId] = useState(null);
  const [approvalSuccess, setApprovalSuccess] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [riskCategories, setRiskCategories] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedApp, setSelectedApp] = useState(null);
  const [formDetails, setFormDetails] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  // Load application details + documents + risk
  const loadApplicationDetails = useCallback(
    async (applicationId) => {
      try {
        const app = applications.find((a) => a.id === applicationId);
        if (!app) return;

        setSelectedApp(app);

        const [details, docs] = await Promise.all([
          getApplicationFormDetails(applicationId),
          getApplicationDocuments(applicationId),
        ]);
        setFormDetails(details);
        setDocuments(docs);

        setOpenDialogs((prev) => ({ ...prev, [applicationId]: true }));

        if (details.length > 0) {
          try {
            const riskData = await getApplicationRiskScore(applicationId, 0.5);
            const formattedRiskData = {
              weighted_score: riskData.weighted?.score || 0,
              weighted_level: riskData.weighted?.level || "low",
              weighted_factors: riskData.weighted?.factors || [],
              rule_based_score: riskData.rule_based?.score || 0,
              rule_based_level: riskData.rule_based?.level || "low",
              rule_based_factors: riskData.rule_based?.factors || [],
              ml_score: riskData.ml_based?.score || 0,
              ml_level: riskData.ml_based?.level || "low",
              ml_factors: riskData.ml_based?.factors || [],
              comments: riskData.comments || [],
              scoring_method: riskData.scoring_method || "rule_based",
              risk_label: riskData.overall_label || "low",
            };
            setRiskAssessment(formattedRiskData);
          } catch (riskErr) {
            console.error("Risk assessment fetch failed:", riskErr);
          }
        }
      } catch (err) {
        console.error("Error loading application details:", err);
        setError(err.message);
      }
    },
    [applications]
  );

  // Handle URL params like ?application=xyz&view=details
  useEffect(() => {
    const appId = searchParams.get("application");
    const view = searchParams.get("view");
    if (appId && view === "details" && applications.length > 0) {
      const app = applications.find((a) => a.id === appId);
      if (app) loadApplicationDetails(appId);
    }
  }, [searchParams, applications, loadApplicationDetails]);

  // Filter and sort logic
  const filterApplications = useCallback(() => {
    let filtered = [...applications];

    if (searchTerm) {
      filtered = filtered.filter((app) =>
        app.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Sort the filtered applications
    filtered.sort((a, b) => {
      const aValue = sortConfig.key === 'created_at' ? new Date(a[sortConfig.key]) : a[sortConfig.key];
      const bValue = sortConfig.key === 'created_at' ? new Date(b[sortConfig.key]) : b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [applications, searchTerm, statusFilter, sortConfig]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, sortConfig, filterApplications]);
  
  // Check for URL parameters to open application details
  useEffect(() => {
    const checkUrlParams = async () => {
      // Only run this effect when applications are loaded and not loading
      if (applications.length > 0 && !loading) {
        const applicationParam = searchParams.get('application');
        const viewParam = searchParams.get('view');
        
        if (applicationParam && viewParam === 'details') {
          // Find the application in our loaded data
          const app = applications.find(a => a.id === applicationParam);
          if (app) {
            try {
              // Set search term to the application ID to ensure it's visible regardless of pagination
              setSearchTerm(applicationParam);
              
              // Reset other filters to ensure the application is visible
              setStatusFilter('all');
              
              // Force filtering to happen immediately
              const filtered = applications.filter(app => app.id.includes(applicationParam));
              setFilteredApplications(filtered);
              
              // Reset to first page since we're filtering to show just this application
              setCurrentPage(1);
              
              // Small delay to ensure UI updates before opening dialog
              setTimeout(async () => {
                // Set selected app
                setSelectedApp(app);
                
                // Fetch details directly
                const [details, docs] = await Promise.all([
                  getApplicationFormDetails(applicationParam),
                  getApplicationDocuments(applicationParam),
                ]);
                
                setFormDetails(details);
                setDocuments(docs);
                
                // Open dialog immediately
                setOpenDialogs(prev => ({ ...prev, [applicationParam]: true }));
                
                // Get risk data if needed
                if (details.length > 0) {
                  const riskData = await getApplicationRiskScore(applicationParam, 0.5);
                  const formattedRiskData = {
                    weighted_score: riskData.weighted?.score || 0,
                    weighted_level: riskData.weighted?.level || "low",
                    weighted_factors: riskData.weighted?.factors || [],
                    rule_based_score: riskData.rule_based?.score || 0,
                    rule_based_level: riskData.rule_based?.level || "low",
                    rule_based_factors: riskData.rule_based?.factors || [],
                    ml_score: riskData.ml_based?.score || 0,
                    ml_level: riskData.ml_based?.level || "low",
                    ml_factors: riskData.ml_based?.factors || [],
                    comments: riskData.comments || [],
                    scoring_method: riskData.scoring_method || "rule_based",
                    risk_label: riskData.overall_label || "low",
                  };
                  setRiskAssessment(formattedRiskData);
                }
              }, 100);
            } catch (error) {
              console.error("Error loading application details from URL params:", error);
            }
          }
        }
      }
    };
    
    checkUrlParams();
  }, [applications, loading, searchParams]); // Don't include functions in dependencies

  // Refresh all applications
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const appsData = await getAllApplications();
      setApplications(appsData);
      setIsRefreshing(false);
    } catch (err) {
      setError(err.message);
      setIsRefreshing(false);
    }
  };

  // No timeline functionality

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsData, usersData, riskCategoriesData] = await Promise.all([
          getAllApplications(),
          getAllUsers(),
          getRiskCategories(),
        ]);
        setApplications(appsData);
        setFilteredApplications(appsData);
        setUsers(usersData);
        setRiskCategories(riskCategoriesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (!user) {
    return (
      <p className="text-center mt-8">
        You need to be logged in to view this page.
      </p>
    );
  }
  if (role !== "admin") {
    return (
      <p className="text-center mt-8">
        You do not have permission to access this page.
      </p>
    );
  }
  if (loading) {
    return <p className="text-center mt-8">Loading...</p>;
  }
  if (error) {
    return (
      <p className="text-center mt-8 text-red-500">Error: {error}</p>
    );
  }

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplications.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSortConfig({ key: 'created_at', direction: 'desc' });
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      setApprovingId(applicationId);
      setApprovalSuccess(null);
      
      await approveApplication(applicationId);
      
      // Update the application status in the local state
      setApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId ? { ...app, status: 'approved' } : app
        )
      );
      
      setFilteredApplications(prevApps => 
        prevApps.map(app => 
          app.id === applicationId ? { ...app, status: 'approved' } : app
        )
      );
      
      setApprovalSuccess(applicationId);
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setApprovalSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error approving application:', error);
      setError(`Failed to approve application: ${error.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const requestSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const statusOptions = [
    "all",
    ...Array.from(new Set(applications.map((app) => app.status))),
  ];

  const formatDate = (date) => (date ? format(date, "PPP") : "");

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-6 bg-zinc-800/50 p-4 rounded-lg backdrop-blur-sm border border-zinc-700/50 shadow-xl"
        >
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-orange-500">Admin</span> Dashboard
          </h1>
          <Button
            variant="outline"
            onClick={logout}
            className="border-orange-600 hover:bg-orange-600/90 text-orange-500 hover:text-white transition-colors duration-200"
          >
            Logout
          </Button>
        </motion.div>

        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="bg-zinc-800/70 border border-zinc-700/50 mb-4">
            <TabsTrigger
              value="applications"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              Applications
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              Users
            </TabsTrigger>
            <TabsTrigger
              value="risk"
              className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              Risk Assessment
            </TabsTrigger>
          </TabsList>

          {/* ========= APPLICATIONS TAB ========= */}
          <TabsContent value="applications">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              {/* Applications Card */}
              <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-semibold text-zinc-100">
                      Applications
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshData}
                      disabled={isRefreshing}
                      className="border-blue-600 bg-blue-600/10 hover:bg-blue-600/90 text-blue-400 hover:text-white transition-colors duration-200"
                    >
                      <ArrowUpDown
                        className={`h-4 w-4 mr-2 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>

                {/* Filters */}
                <CardContent className="pt-6">
                  <div className="bg-zinc-900/50 rounded-lg p-4 mb-6 border border-zinc-800/50">
                    <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center">
                      <Filter className="h-4 w-4 mr-2 text-orange-500" />
                      Filters
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Search by ID */}
                      <div>
                        <Label
                          htmlFor="search"
                          className="text-xs text-zinc-400"
                        >
                          Search by ID
                        </Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                          <Input
                            id="search"
                            placeholder="Application ID"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 bg-zinc-800/70 border-zinc-700 text-zinc-300 placeholder:text-zinc-500"
                          />
                        </div>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <Label
                          htmlFor="status"
                          className="text-xs text-zinc-400"
                        >
                          Status
                        </Label>
                        <Select
                          value={statusFilter}
                          onValueChange={setStatusFilter}
                        >
                          <SelectTrigger className="bg-zinc-800/70 border-zinc-700 text-zinc-300">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {statusOptions.map((status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="text-zinc-300 focus:bg-zinc-700 focus:text-white"
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Sort by Date */}
                      <div className="md:col-span-2">
                        <Label
                          htmlFor="sortDate"
                          className="text-xs text-zinc-400"
                        >
                          Sort by Date
                        </Label>
                        <Button
                          id="sortDate"
                          variant="outline"
                          onClick={() => requestSort('created_at')}
                          className="w-full justify-between text-left font-normal bg-zinc-800/70 border-blue-600/50 text-zinc-300 hover:border-blue-500"
                        >
                          <span>Created Date</span>
                          <ArrowUpDown className="h-4 w-4 text-zinc-500" />
                          <span className="ml-2 text-xs text-zinc-500">
                            {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '(Oldest first)' : '(Newest first)') : ''}
                          </span>
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="border-orange-600/70 hover:bg-orange-600/90 text-orange-500 hover:text-white transition-colors duration-200"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>

                  {/* Results count + per-page selector */}
                  <div className="flex justify-between items-center mb-4 text-sm text-zinc-400">
                    <span>
                      Showing{" "}
                      {filteredApplications.length > 0
                        ? indexOfFirstItem + 1
                        : 0}
                      -{Math.min(indexOfLastItem, filteredApplications.length)} of{" "}
                      {filteredApplications.length} applications
                    </span>
                    <Select
                      value={String(itemsPerPage)}
                      onValueChange={(value) => setItemsPerPage(Number(value))}
                    >
                      <SelectTrigger className="w-[100px] bg-zinc-800/70 border-zinc-700 text-zinc-300">
                        <SelectValue placeholder="Per page" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem
                          value="5"
                          className="text-zinc-300 focus:bg-zinc-700 focus:text-white"
                        >
                          5
                        </SelectItem>
                        <SelectItem
                          value="10"
                          className="text-zinc-300 focus:bg-zinc-700 focus:text-white"
                        >
                          10
                        </SelectItem>
                        <SelectItem
                          value="20"
                          className="text-zinc-300 focus:bg-zinc-700 focus:text-white"
                        >
                          20
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Application list */}
                  <div className="space-y-4">
                    {filteredApplications.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400">
                        <FileText className="mx-auto h-12 w-12 opacity-20 mb-2" />
                        <p>No applications found matching your filters.</p>
                      </div>
                    ) : (
                      currentItems.map((app) => (
                        <motion.div
                          key={app.id}
                          initial={itemVariants.hidden}
                          animate={itemVariants.visible}
                          variants={itemVariants}
                        >
                          <Card className="bg-zinc-900/80 border border-zinc-800/50 hover:border-zinc-700/50 transition-all duration-200 overflow-hidden">
                            <CardContent className="p-0">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-zinc-200 text-sm">
                                      {app.id}
                                    </h3>
                                    <Badge
                                      className={`ml-2 ${
                                        app.status === "approved"
                                          ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                          : app.status === "completed"
                                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                          : app.status === "in_progress"
                                          ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                          : "bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"
                                      }`}
                                    >
                                      {app.status === "approved" ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                          Approved
                                        </>
                                      ) : app.status === "completed" ? (
                                        <>
                                          <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                          Completed
                                        </>
                                      ) : app.status === "in_progress" ? (
                                        <>
                                          <Clock className="w-3 h-3 mr-1" /> In
                                          Progress
                                        </>
                                      ) : (
                                        <>
                                          <AlertTriangle className="w-3 h-3 mr-1" />{" "}
                                          {app.status}
                                        </>
                                      )}
                                    </Badge>
                                    {approvalSuccess === app.id && (
                                      <span className="text-xs text-purple-400 ml-2 animate-pulse">
                                        Application approved successfully!
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-400">
                                    Created:{" "}
                                    {new Date(
                                      app.created_at
                                    ).toLocaleDateString()}{" "}
                                    at{" "}
                                    {new Date(
                                      app.created_at
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  {app.status !== 'approved' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveApplication(app.id)}
                                      disabled={approvingId === app.id}
                                      className="bg-purple-600/10 border-purple-600/50 hover:bg-purple-600/90 text-purple-400 hover:text-white transition-colors duration-200"
                                    >
                                      {approvingId === app.id ? (
                                        <>
                                          <span className="animate-spin mr-1">⏳</span> Approving...
                                        </>
                                      ) : (
                                        <>Approve</>  
                                      )}
                                    </Button>
                                  )}
                                  <Dialog
                                    open={!!openDialogs[app.id]}
                                    onOpenChange={(open) =>
                                      setOpenDialogs((prev) => ({
                                        ...prev,
                                        [app.id]: open,
                                      }))
                                    }
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          loadApplicationDetails(app.id)
                                        }
                                        className="bg-blue-600/10 border-blue-600/50 hover:bg-blue-600/90 text-blue-400 hover:text-white transition-colors duration-200"
                                      >
                                        View Details
                                      </Button>
                                    </DialogTrigger>

                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-zinc-700">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Application Details
                                      </DialogTitle>
                                    </DialogHeader>

                                    {error && (
                                      <p className="text-red-500 p-4">
                                        {error}
                                      </p>
                                    )}

                                    {selectedApp && formDetails && (
                                      <div className="space-y-4">
                                        <div className="grid gap-4">
                                          {/* Application Overview */}
                                          <Card>
                                            <CardHeader>
                                              <CardTitle>
                                                Application Overview
                                              </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                              <p>
                                                <strong>Application ID:</strong>{" "}
                                                {selectedApp.id}
                                              </p>
                                              <p>
                                                <strong>Status:</strong>{" "}
                                                <Badge
                                                  className={`ml-2 ${
                                                    selectedApp.status === "approved"
                                                      ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                                                      : selectedApp.status === "completed"
                                                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                                      : selectedApp.status === "in_progress"
                                                      ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                                      : "bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"
                                                  }`}
                                                >
                                                  {selectedApp.status === "approved" ? (
                                                    <>
                                                      <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                      Approved
                                                    </>
                                                  ) : selectedApp.status === "completed" ? (
                                                    <>
                                                      <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                                      Completed
                                                    </>
                                                  ) : selectedApp.status === "in_progress" ? (
                                                    <>
                                                      <Clock className="w-3 h-3 mr-1" /> In
                                                      Progress
                                                    </>
                                                  ) : (
                                                    <>
                                                      <AlertTriangle className="w-3 h-3 mr-1" />{" "}
                                                      {selectedApp.status}
                                                    </>
                                                  )}
                                                </Badge>
                                              </p>
                                              <p>
                                                <strong>Created:</strong>{" "}
                                                {new Date(
                                                  selectedApp.created_at
                                                ).toLocaleDateString()}
                                              </p>
                                            </CardContent>
                                          </Card>

                                          {/* Overall Progress */}
                                          <Card>
                                            <CardHeader>
                                              <CardTitle>
                                                Overall Progress
                                              </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                              <Progress
                                                value={
                                                  (formDetails.length / 9) * 100
                                                }
                                                className="w-full"
                                              />
                                              <p className="text-sm text-muted-foreground mt-2">
                                                {formDetails.length} of 9 forms
                                                completed
                                              </p>
                                            </CardContent>
                                          </Card>

                                          {/* Documents */}
                                          <Card>
                                            <CardHeader>
                                              <CardTitle>
                                                Uploaded Documents
                                              </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                              {documents.length === 0 ? (
                                                <p className="text-muted-foreground">
                                                  No documents uploaded yet.
                                                </p>
                                              ) : (
                                                <div className="space-y-2">
                                                  {documents.map((doc) => (
                                                    <div
                                                      key={doc.id}
                                                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                                                    >
                                                      <span className="text-sm truncate max-w-[300px]">
                                                        {doc.name}
                                                      </span>
                                                      <div className="space-x-2">
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={() =>
                                                            window.open(
                                                              doc.url,
                                                              "_blank"
                                                            )
                                                          }
                                                        >
                                                          View
                                                        </Button>
                                                        <Button
                                                          variant="outline"
                                                          size="sm"
                                                          onClick={async () => {
                                                            try {
                                                              await downloadDocument(
                                                                selectedApp.id,
                                                                doc.id,
                                                                doc.name
                                                              );
                                                            } catch (err) {
                                                              console.error(
                                                                "Error downloading:",
                                                                err
                                                              );
                                                              setError(
                                                                "Failed to download document"
                                                              );
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

                                          {/* Risk Assessment */}
                                          {formDetails.length > 0 && (
                                            <Card>
                                              <CardHeader>
                                                <CardTitle className="flex items-center justify-between">
                                                  <span>Risk Assessment</span>
                                                  {riskAssessment && (
                                                    <span
                                                      className="px-3 py-1 text-sm font-medium rounded-full"
                                                      style={{
                                                        backgroundColor:
                                                          riskCategories?.[
                                                            riskAssessment.risk_label
                                                          ]?.color + "20",
                                                        color:
                                                          riskCategories?.[
                                                            riskAssessment.risk_label
                                                          ]?.color,
                                                        border: `1px solid ${
                                                          riskCategories?.[
                                                            riskAssessment.risk_label
                                                          ]?.color
                                                        }`,
                                                      }}
                                                    >
                                                      {riskAssessment.risk_label}{" "}
                                                      Risk
                                                    </span>
                                                  )}
                                                </CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                {riskAssessment ? (
                                                  <div className="space-y-6">
                                                    {/* Weighted Score */}
                                                    <div>
                                                      <h4 className="text-sm font-semibold mb-3">
                                                        Weighted Assessment
                                                      </h4>
                                                      <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-medium">
                                                          Combined Risk Score
                                                        </span>
                                                        <span className="text-sm font-bold">
                                                          {riskAssessment.weighted_score ||
                                                            0}
                                                          /100
                                                        </span>
                                                      </div>
                                                      <Progress
                                                        value={
                                                          riskAssessment.weighted_score ||
                                                          0
                                                        }
                                                        className="w-full h-3"
                                                        indicatorClassName={`${
                                                          riskAssessment.weighted_level ===
                                                          "high"
                                                            ? "bg-red-500"
                                                            : riskAssessment.weighted_level ===
                                                              "medium"
                                                            ? "bg-yellow-500"
                                                            : "bg-green-500"
                                                        }`}
                                                      />
                                                      <p className="text-xs text-gray-500 mt-1">
                                                        Combined rule-based and ML
                                                        analysis
                                                      </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                                      {/* Rule-Based */}
                                                      <div>
                                                        <h4 className="text-sm font-semibold mb-2">
                                                          Rule-Based Assessment
                                                        </h4>
                                                        <div className="flex justify-between items-center mb-2">
                                                          <span className="text-sm font-medium">
                                                            Score
                                                          </span>
                                                          <span className="text-sm font-bold">
                                                            {
                                                              riskAssessment.rule_based_score
                                                            }
                                                            /100
                                                          </span>
                                                        </div>
                                                        <Progress
                                                          value={
                                                            riskAssessment.rule_based_score
                                                          }
                                                          className="w-full"
                                                          indicatorClassName={`${
                                                            riskAssessment.rule_based_level ===
                                                            "high"
                                                              ? "bg-red-500"
                                                              : riskAssessment.rule_based_level ===
                                                                "medium"
                                                              ? "bg-yellow-500"
                                                              : "bg-green-500"
                                                          }`}
                                                        />
                                                      </div>

                                                      {/* ML-Based */}
                                                      {riskAssessment.ml_score !==
                                                        null && (
                                                        <div>
                                                          <h4 className="text-sm font-semibold mb-2">
                                                            ML Model Assessment
                                                          </h4>
                                                          <div className="flex justify-between items-center mb-2">
                                                            <span className="text-sm font-medium">
                                                              Score
                                                            </span>
                                                            <span className="text-sm font-bold">
                                                              {
                                                                riskAssessment.ml_score
                                                              }
                                                              /100
                                                            </span>
                                                          </div>
                                                          <Progress
                                                            value={
                                                              riskAssessment.ml_score
                                                            }
                                                            className="w-full"
                                                            indicatorClassName={`${
                                                              riskAssessment.ml_level ===
                                                              "high"
                                                                ? "bg-red-500"
                                                                : riskAssessment.ml_level ===
                                                                  "medium"
                                                                ? "bg-yellow-500"
                                                                : "bg-green-500"
                                                            }`}
                                                          />
                                                        </div>
                                                      )}
                                                    </div>

                                                    {/* Rule-Based Factors */}
                                                    {riskAssessment.rule_based_factors &&
                                                      riskAssessment.rule_based_factors
                                                        .length > 0 && (
                                                        <div className="mt-4">
                                                          <h4 className="text-sm font-semibold mb-2">
                                                            Rule-Based Risk Factors
                                                          </h4>
                                                          <ul className="space-y-2">
                                                            {riskAssessment.rule_based_factors.map(
                                                              (factor, idx) => (
                                                                <li
                                                                  key={idx}
                                                                  className="text-sm p-2 border rounded bg-muted/20"
                                                                >
                                                                  <span
                                                                    className="inline-block w-2 h-2 rounded-full mr-2"
                                                                    style={{
                                                                      backgroundColor:
                                                                        factor.impact ===
                                                                        "high"
                                                                          ? "#EF4444"
                                                                          : factor.impact ===
                                                                            "medium"
                                                                          ? "#F59E0B"
                                                                          : "#10B981",
                                                                    }}
                                                                  />
                                                                  <strong>
                                                                    {factor.name}
                                                                  </strong>
                                                                  <p className="mt-1 text-xs text-muted-foreground">
                                                                    {factor.description}
                                                                  </p>
                                                                </li>
                                                              )
                                                            )}
                                                          </ul>
                                                        </div>
                                                      )}

                                                    {/* ML-Based Factors */}
                                                    {riskAssessment.ml_factors &&
                                                      riskAssessment.ml_factors.length >
                                                        0 && (
                                                        <div className="mt-4">
                                                          <h4 className="text-sm font-semibold mb-2">
                                                            ML Model Risk Factors
                                                          </h4>
                                                          <ul className="space-y-2">
                                                            {riskAssessment.ml_factors.map(
                                                              (factor, idx) => (
                                                                <li
                                                                  key={idx}
                                                                  className="text-sm p-2 border rounded bg-muted/20"
                                                                >
                                                                  <span
                                                                    className="inline-block w-2 h-2 rounded-full mr-2"
                                                                    style={{
                                                                      backgroundColor:
                                                                        factor.impact ===
                                                                        "high"
                                                                          ? "#EF4444"
                                                                          : factor.impact ===
                                                                            "medium"
                                                                          ? "#F59E0B"
                                                                          : "#10B981",
                                                                    }}
                                                                  />
                                                                  <strong>
                                                                    {factor.name}
                                                                  </strong>
                                                                  <p className="mt-1 text-xs text-muted-foreground">
                                                                    {factor.description}
                                                                  </p>
                                                                </li>
                                                              )
                                                            )}
                                                          </ul>
                                                        </div>
                                                      )}

                                                    {/* Comments */}
                                                    {riskAssessment.comments &&
                                                      riskAssessment.comments.length >
                                                        0 && (
                                                        <div className="mt-4">
                                                          <h4 className="text-sm font-semibold mb-2">
                                                            Additional Comments
                                                          </h4>
                                                          <ul className="space-y-2">
                                                            {riskAssessment.comments.map(
                                                              (comment, idx) => (
                                                                <li
                                                                  key={idx}
                                                                  className="text-sm p-2 border rounded bg-muted/20"
                                                                >
                                                                  {comment}
                                                                </li>
                                                              )
                                                            )}
                                                          </ul>
                                                        </div>
                                                      )}

                                                    <div className="text-xs text-muted-foreground mt-2">
                                                      Scoring method:{" "}
                                                      {riskAssessment.scoring_method ===
                                                      "machine_learning"
                                                        ? "Machine Learning"
                                                        : "Rule-based assessment"}
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="py-4 text-center">
                                                    <p className="text-sm text-muted-foreground">
                                                      Loading risk assessment...
                                                    </p>
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>
                                          )}

                                          {/* Form Details */}
                                          {formDetails.map((form) => {
                                            const formProgress =
                                              Object.keys(form.data || {})
                                                .length > 0
                                                ? 100
                                                : 0;
                                            return (
                                              <Card key={form.id}>
                                                <CardHeader className="pb-2">
                                                  <div className="flex justify-between items-center">
                                                    <CardTitle className="text-lg">
                                                      {form.step
                                                        .split("_")
                                                        .map(
                                                          (word) =>
                                                            word.charAt(0).toUpperCase() +
                                                            word.slice(1)
                                                        )
                                                        .join(" ")}
                                                    </CardTitle>
                                                    <span
                                                      className={`px-2 py-1 rounded text-sm ${
                                                        formProgress === 100
                                                          ? "bg-green-100 text-green-800"
                                                          : "bg-yellow-100 text-yellow-800"
                                                      }`}
                                                    >
                                                      {formProgress === 100
                                                        ? "Completed"
                                                        : "In Progress"}
                                                    </span>
                                                  </div>
                                                  <Progress
                                                    value={formProgress}
                                                    className="mt-2"
                                                  />
                                                </CardHeader>
                                                <CardContent>
                                                  <div className="grid gap-3">
                                                    {Object.entries(form.data || {}).map(
                                                      ([key, value]) => (
                                                        <div
                                                          key={key}
                                                          className="border rounded-lg p-3 bg-muted/20"
                                                        >
                                                          <div className="font-medium mb-1">
                                                            {key
                                                              .split("_")
                                                              .map(
                                                                (word) =>
                                                                  word.charAt(0).toUpperCase() +
                                                                  word.slice(1)
                                                              )
                                                              .join(" ")}
                                                          </div>
                                                          <div className="text-sm text-muted-foreground">
                                                            {typeof value === "object"
                                                              ? JSON.stringify(
                                                                  value,
                                                                  null,
                                                                  2
                                                                )
                                                              : value.toString()}
                                                          </div>
                                                        </div>
                                                      )
                                                    )}
                                                    {Object.keys(form.data || {})
                                                      .length === 0 && (
                                                      <p className="text-sm text-muted-foreground">
                                                        No data submitted yet
                                                      </p>
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
                            </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Pagination controls */}
                  {filteredApplications.length > itemsPerPage && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-orange-600/70 text-orange-500 hover:text-white hover:bg-orange-600/90 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-zinc-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="border-orange-600/70 text-orange-500 hover:text-white hover:bg-orange-600/90 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ========= USERS TAB ========= */}
          <TabsContent value="users">
            <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center p-4 bg-zinc-900/70 rounded-md">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="ml-auto font-medium">{u.role}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ========= RISK TAB ========= */}
          <TabsContent value="risk">
            <div className="grid gap-4">
              <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm shadow-xl">
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
                              {applications.filter((app) => app.risk_score >= 75).length}
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
                              {applications.filter((app) => app.risk_score >= 50 && app.risk_score < 75).length}
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
                              {applications.filter((app) => app.risk_score < 50).length}
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

              <Card className="bg-zinc-800/50 border-zinc-700/50 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle>Recent Risk Assessments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {applications.length > 0 ? (
                      applications
                        .filter((app) => app.risk_score !== undefined)
                        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                        .slice(0, 5)
                        .map((app) => (
                          <div
                            key={app.id}
                            className="flex items-center justify-between p-4 bg-zinc-900/70 rounded-md"
                          >
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
                                    ? "bg-red-100 text-red-800"
                                    : app.risk_score >= 50
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {app.risk_score >= 75
                                  ? "High Risk"
                                  : app.risk_score >= 50
                                  ? "Medium Risk"
                                  : "Low Risk"}
                              </span>
                              <span className="text-sm font-medium">
                                {app.risk_score}%
                              </span>
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
    </div>
  );
}

export default AdminDashboard;
