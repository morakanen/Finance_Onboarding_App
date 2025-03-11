import axios from "axios";

const API_BASE_URL = "/api"; // ✅ Correct: Nginx will forward to FastAPI

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