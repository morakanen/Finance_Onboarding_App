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

// Update Application Status API
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

// Get Risk Assessment for Application
export const getApplicationRiskScore = async (applicationId) => {
  try {
    // Use all available form data to get the most accurate risk assessment
    const forms = await getApplicationFormDetails(applicationId);
    
    // Combine all form data into a single object
    const combinedData = {};
    
    // Map to store which form contains which fields - useful for debugging
    const fieldSources = {};
    
    forms.forEach(form => {
      if (form.data) {
        // Track which form each field comes from
        Object.keys(form.data).forEach(key => {
          fieldSources[key] = form.step;
        });
        
        // Merge the data
        Object.assign(combinedData, form.data);
      }
    });
    
    // For specific key fields needed by risk model, make sure they're present
    // and correctly named based on our form structure
    
    // Required fields with default values
    const requiredFields = {
      country: 'United Kingdom',
      sector: 'Other',
      businessType: 'Limited Company',
      contactType: 'Email',
      introductoryCategory: 'Other',
      gender: 'Not Specified'
    };

    // Set default values for missing required fields
    Object.entries(requiredFields).forEach(([field, defaultValue]) => {
      if (!combinedData[field]) {
        combinedData[field] = defaultValue;
        console.log(`Using default value for ${field}: ${defaultValue}`);
      }
    });

    // Ensure we have risk assessment responses
    for (let i = 1; i <= 7; i++) {
      // If we have response but no comment, add empty comment
      if (combinedData[`risk_q${i}_response`] && !combinedData[`risk_q${i}_comment`]) {
        combinedData[`risk_q${i}_comment`] = '';
      }
      // If we have comment but no response, default to 'no'
      if (combinedData[`risk_q${i}_comment`] && !combinedData[`risk_q${i}_response`]) {
        combinedData[`risk_q${i}_response`] = 'no';
      }
      // If neither exists, set both to defaults
      if (!combinedData[`risk_q${i}_response`] && !combinedData[`risk_q${i}_comment`]) {
        combinedData[`risk_q${i}_response`] = 'no';
        combinedData[`risk_q${i}_comment`] = '';
      }
    }
    
    console.log('Sending risk assessment data:', {
      applicationId,
      dataFields: Object.keys(combinedData),
      fieldSources,
      sampleData: {
        country: combinedData.country,
        sector: combinedData.sector,
        businessType: combinedData.businessType
      }
    });
    
    const token = localStorage.getItem('token');
    const response = await api.post('/api/applications/risk-score', combinedData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching risk assessment:', error);
    throw new Error(error.response?.data?.detail || "Failed to fetch risk assessment");
  }
};

// Get Risk Categories Info
export const getRiskCategories = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/api/risk-categories', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const categories = response.data.categories;
    
    // Convert category names to title case for display
    return {
      'high': {
        ...categories.high,
        displayName: 'High'
      },
      'medium': {
        ...categories.medium,
        displayName: 'Medium'
      },
      'low': {
        ...categories.low,
        displayName: 'Low'
      }
    };
  } catch (error) {
    console.error('Error fetching risk categories:', error);
    // Return default categories if API fails
    return {
      'high': {
        threshold: 70,
        description: 'High risk clients require enhanced due diligence',
        color: '#EF4444',
        displayName: 'High'
      },
      'medium': {
        threshold: 40,
        description: 'Medium risk clients require standard due diligence',
        color: '#F59E0B',
        displayName: 'Medium'
      },
      'low': {
        threshold: 0,
        description: 'Low risk clients require simplified due diligence',
        color: '#10B981',
        displayName: 'Low'
      }
    };
  }
};