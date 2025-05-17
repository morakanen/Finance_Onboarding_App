/**
 * Utility functions for form handling and progress tracking
 */

/**
 * Save form progress to the backend
 * @param {string} step - The form step name
 * @param {Object} values - The form values to save
 * @param {string} applicationId - The application ID (optional, will try to get from localStorage)
 * @returns {Promise<boolean>} - True if save was successful, false otherwise
 */
export const saveFormProgress = async (step, values, applicationId) => {
  try {
    // Get the effective application ID
    const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId');
    
    if (!effectiveAppId) {
      console.error(`No application ID available for ${step} form save`);
      return false;
    }
    
    console.log(`Saving ${step} form data for application ID: ${effectiveAppId}`);
    
    // Ensure we have valid data to save
    if (!values) {
      console.error(`No form data provided for ${step}`);
      return false;
    }
    
    // Make sure values is an object and not null
    const dataToSave = values || {};
    
    // Add a timestamp to track when this form was saved
    const enhancedData = {
      ...dataToSave,
      _lastSaved: new Date().toISOString(),
      _formVersion: '1.0'
    };
    
    console.log(`Preparing to save ${step} form with fields:`, Object.keys(enhancedData));
    
    // Save form data to the database
    const response = await fetch("http://localhost:8000/api/form-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: effectiveAppId,
        step,
        data: enhancedData,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server error (${response.status}) saving ${step} form:`, errorText);
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`Successfully saved ${step} form data:`, result);
    
    // Store a local record that this form was completed
    try {
      // Get existing completed forms from localStorage
      const completedFormsKey = `completed_forms_${effectiveAppId}`;
      const completedForms = JSON.parse(localStorage.getItem(completedFormsKey) || '{}');
      
      // Mark this form as completed
      completedForms[step] = {
        timestamp: new Date().toISOString(),
        fields: Object.keys(dataToSave).length
      };
      
      // Save back to localStorage
      localStorage.setItem(completedFormsKey, JSON.stringify(completedForms));
      console.log(`Updated local progress tracking for ${step}`);
    } catch (localStorageError) {
      console.warn(`Could not update local progress tracking:`, localStorageError);
    }
    
    return true;
  } catch (error) {
    console.error(`Error saving ${step} form:`, error);
    return false;
  }
};

/**
 * Load form data from the backend
 * @param {string} step - The form step name
 * @param {Function} resetForm - Function to reset the form with loaded data
 * @param {string} applicationId - The application ID (optional, will try to get from localStorage)
 */
export const loadFormData = async (step, resetForm, applicationId) => {
  try {
    // Get the effective application ID
    const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId');
    
    if (!effectiveAppId) {
      console.error(`No application ID available for ${step} form`);
      return;
    }
    
    console.log(`Loading ${step} form data for application ID: ${effectiveAppId}`);
    
    // Track form visits in localStorage to help with progress tracking
    try {
      const visitedFormsKey = `visited_forms_${effectiveAppId}`;
      const visitedForms = JSON.parse(localStorage.getItem(visitedFormsKey) || '{}');
      
      // Mark this form as visited
      visitedForms[step] = {
        timestamp: new Date().toISOString(),
        visits: (visitedForms[step]?.visits || 0) + 1
      };
      
      // Save back to localStorage
      localStorage.setItem(visitedFormsKey, JSON.stringify(visitedForms));
      console.log(`Updated local visit tracking for ${step}`);
    } catch (localStorageError) {
      console.warn(`Could not update local visit tracking:`, localStorageError);
    }
    
    // Add cache control to prevent browser caching
    const response = await fetch(`http://localhost:8000/api/form-progress/${effectiveAppId}/${step}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log(`${step} form data response status:`, response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No data found for ${step}, initializing with empty data`);
        // Create an empty form data record with metadata to track this form was visited
        const emptyData = {
          _formVisited: true,
          _firstVisit: new Date().toISOString(),
          _formVersion: '1.0'
        };
        
        // Save this empty form to register the step in progress tracking
        await saveFormProgress(step, emptyData, effectiveAppId);
        return;
      }
      console.error(`Error fetching ${step} data:`, response.status, response.statusText);
      return;
    }
    
    try {
      const data = await response.json();
      console.log(`${step} form data retrieved:`, data);
      
      if (data && data.data) {
        // Remove our metadata fields before passing to the form
        const formData = { ...data.data };
        delete formData._lastSaved;
        delete formData._formVersion;
        delete formData._formVisited;
        delete formData._firstVisit;
        
        console.log(`Resetting ${step} form with data:`, formData);
        resetForm(formData);
        
        // Track that we loaded this form successfully
        const loadedFormsKey = `loaded_forms_${effectiveAppId}`;
        const loadedForms = JSON.parse(localStorage.getItem(loadedFormsKey) || '{}');
        loadedForms[step] = { timestamp: new Date().toISOString() };
        localStorage.setItem(loadedFormsKey, JSON.stringify(loadedForms));
      } else {
        console.warn(`${step} form data is empty or invalid:`, data);
        // Initialize with empty data if the server returned a malformed response
        await saveFormProgress(step, { _formVisited: true }, effectiveAppId);
      }
    } catch (parseError) {
      console.error(`Error parsing ${step} form data:`, parseError);
    }
  } catch (error) {
    console.error(`Error loading ${step} form data:`, error);
    // Try to save an empty form to ensure this step is registered in progress tracking
    try {
      await saveFormProgress(step, { _formVisited: true }, applicationId);
    } catch (saveError) {
      console.error(`Failed to save empty ${step} form:`, saveError);
    }
  }
};
