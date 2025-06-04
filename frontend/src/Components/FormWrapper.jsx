import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import SaveProgressButton from "./SaveProgressButton";
import { Button } from "@/components/ui/button";
import { saveFormProgress } from "../utils/formUtils";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-5xl mx-auto"
    >
      <Card className="bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden">
        {title && (
          <div className="p-6 border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-800">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
        )}
        <CardContent className="p-6 bg-zinc-900/70">
          {children}
        </CardContent>
        <CardFooter className="flex justify-between p-6 border-t border-zinc-800 bg-zinc-900/80">
          {showPrevious ? (
            <Button
              type="button"
              variant="outline"
              onClick={onPrevious}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
          ) : (
            <div></div> // Empty div to maintain spacing
          )}
          <div className="flex gap-3">
            <SaveProgressButton 
              onSave={handleSave}
              variant="secondary"
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all duration-200"
            />
            <Button 
              type="submit" 
              onClick={onSubmit}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
            >
              <span>Save & Continue</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default FormWrapper;
