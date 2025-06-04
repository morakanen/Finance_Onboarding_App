import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A reusable button component for saving form progress
 * @param {Object} props
 * @param {Function} props.onSave - Function to call when saving (should return a Promise)
 * @param {string} props.variant - Button variant (default: "secondary")
 * @param {string} props.label - Button label (default: "Save Progress")
 * @param {string} props.className - Additional CSS classes
 */
const SaveProgressButton = ({
  onSave,
  variant = "secondary",
  label = "Save Progress",
  className = ""
}) => {
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
      className={`relative flex items-center gap-2 ${className}`}
    >
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center"
          >
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </motion.div>
        ) : saveSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center text-green-500"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            <span>Saved!</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center"
          >
            <Save className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
};

export default SaveProgressButton;