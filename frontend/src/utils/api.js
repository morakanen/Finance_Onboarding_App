import axios from "axios";

const API_BASE_URL = "http://localhost:8000"; // Updated to direct backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Login API
export const LoginUser = async (email, password) => {
  try {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Failed to log in");
  }
};

// ✅ Register API
export const RegisterUser = async (name, email, password) => {
  try {
    const response = await api.post("/register", { name, email, password });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Failed to register");
  }
};

// ✅ Save Client Details Form Progress
export const saveClientDetails = async (applicationId, step, data) => {
  try {
    // Ensure applicationId is a valid UUID string
    if (!applicationId || typeof applicationId !== 'string' || !applicationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('Invalid applicationId: Must be a valid UUID');
    }

    const payload = {
      application_id: applicationId,
      step,
      data,
    };
    console.log("[DEBUG] Payload sent to /form-progress:", payload);
    const response = await api.post("/form-progress", payload);

    // After saving the form, check if all forms are completed
    const formDetails = await getApplicationFormDetails(applicationId);
    if (formDetails.length === 9) {
      // All forms are completed, update the status
      await updateApplicationStatus(applicationId, 'completed');
    }

    return response.data;
  } catch (error) {
    console.error("Error saving client details:", error);
    throw new Error(error.response?.data?.detail || "Failed to save client details");
  }
};

// ✅ Get Current User API
export const getCurrentUser = async (token) => {
  try {
    const response = await api.get("/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Unauthorized");
  }
};

// ✅ Get All Applications API
export const getAllApplications = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get("/api/applications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Failed to fetch applications");
  }
};

// ✅ Get All Users API
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Failed to fetch users");
  }
};

// ✅ Get Application Form Details API
export const getApplicationFormDetails = async (applicationId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get(`/api/applications/${applicationId}/forms`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Form details response:', response.data); // Add debug logging
    return response.data;
  } catch (error) {
    console.error('Error fetching form details:', error); // Add error logging
    throw new Error(error.response?.data?.detail || "Failed to fetch application form details");
  }
};

// ✅ Update Application Status API
export const updateApplicationStatus = async (applicationId, status) => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.patch(`/api/applications/${applicationId}/status?status=${status}`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw new Error(error.response?.data?.detail || "Failed to update application status");
  }
};