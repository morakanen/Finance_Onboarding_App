import axios from "axios";

const API_BASE_URL = "http://host.docker.internal:8000"; // Change if needed

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;