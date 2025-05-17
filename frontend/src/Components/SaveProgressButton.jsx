import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

/**
 * A reusable button component for saving form progress
 * @param {Object} props
 * @param {Function} props.onSave - Function to call when saving (should return a Promise)
 * @param {string} props.variant - Button variant (default: "secondary")
 * @param {string} props.label - Button label (default: "Save Progress")
 */
const SaveProgressButton = ({ onSave, variant = "secondary", label = "Save Progress" }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await onSave();
      setSaveSuccess(true);
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving progress:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleSave}
      disabled={isSaving}
      className="relative"
    >
      {isSaving && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {saveSuccess && !isSaving && (
        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
      )}
      {label}
    </Button>
  );
};

export default SaveProgressButton;
