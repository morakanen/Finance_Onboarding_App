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