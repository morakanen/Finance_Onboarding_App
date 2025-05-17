import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import SaveProgressButton from "./SaveProgressButton";
import { Button } from "@/components/ui/button";
import { saveFormProgress } from "../utils/formUtils";

/**
 * A wrapper component for form pages that provides consistent layout and save functionality
 * @param {Object} props
 * @param {React.ReactNode} props.children - The form content
 * @param {Function} props.onSubmit - Function to call when the form is submitted
 * @param {Function} props.onPrevious - Function to call when the previous button is clicked
 * @param {Function} props.getValues - Function to get the current form values
 * @param {string} props.step - The form step name
 * @param {string} props.applicationId - The application ID
 * @param {string} props.title - The form title
 * @param {boolean} props.showPrevious - Whether to show the previous button
 */
const FormWrapper = ({ 
  children, 
  onSubmit, 
  onPrevious, 
  getValues, 
  step, 
  applicationId,
  title = "Form",
  showPrevious = true
}) => {
  // Function to save form data
  const handleSave = async () => {
    const values = getValues();
    return await saveFormProgress(step, values, applicationId);
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      {title && (
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
      )}
      <CardContent className="p-6">
        {children}
      </CardContent>
      <CardFooter className="flex justify-between p-6 border-t">
        {showPrevious ? (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
          >
            Previous
          </Button>
        ) : (
          <div></div> // Empty div to maintain spacing
        )}
        <div className="flex gap-2">
          <SaveProgressButton 
            onSave={handleSave}
            variant="secondary"
          />
          <Button type="submit" onClick={onSubmit}>
            Save & Continue
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FormWrapper;
