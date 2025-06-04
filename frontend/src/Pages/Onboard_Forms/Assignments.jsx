import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { saveFormProgress, loadFormData } from "../../utils/formUtils";
import SaveProgressButton from "../../components/SaveProgressButton";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";

const ASSIGNMENT_OPTIONS = [
  "Administration",
  "Administrative receivership",
  "Audit & accountancy combined",
  "Audit exempt accounts prep",
  "Audit only limited companies",
  "BKY",
  "Bookkeeping",
  "Case Bookkeeping",
];

// Helper function to identify required fields
const isFieldRequired = (fieldName) => {
  const requiredFields = ['assignments', 'recurringFees', 'nonRecurringFees'];
  return requiredFields.includes(fieldName);
};

const assignmentsSchema = z.object({
  assignments: z.array(z.string()).min(1, "Select at least one assignment"),
  recurringFees: z.string().min(1, "Recurring fees are required"),
  nonRecurringFees: z.string().min(1, "Non-recurring fees are required"),
});

export default function AssignmentsForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(assignmentsSchema),
    defaultValues: {
      assignments: [],
      recurringFees: "",
      nonRecurringFees: "",
    },
  });

  // --- FORM STEP IDENTIFIER ---
  const step = "assignments";
  const autosaveTimeout = useRef();
  
  // Load saved form data when component mounts
  useEffect(() => {
    if (!applicationId) return;
    loadFormData(step, form.reset, applicationId);
  }, [applicationId, form]);
  
  // Function to save form data without navigating
  const saveFormData = async (values) => {
    return await saveFormProgress(step, values, applicationId);
  };

  useEffect(() => {
    if (!applicationId) return;
    const subscription = form.watch((values) => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
      autosaveTimeout.current = setTimeout(() => {
        fetch("http://localhost:8000/form-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: applicationId,
            step,
            data: values,
          }),
        })
        .catch(err => console.error('Error autosaving form data:', err));
      }, 800);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line
  }, [applicationId, form.watch]);

  const onSubmit = async (values) => {
    try {
      const saved = await saveFormData(values);
      if (saved) {
        // Navigate to the next form with applicationId
        const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId');
        navigate(`/onboarding/kyc/${effectiveAppId}`);
      }
    } catch (error) {
      console.error("Error saving assignments form:", error);
      alert("Failed to save form data");
    }
  };

  return (
    <motion.div 
      className="mx-auto max-w-5xl w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <OnboardingBreadcrumbs />
      <Card className="bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Assignments
          </h2>
          <p className="text-sm text-zinc-400">
            Please select the work to be undertaken and enter estimated fees
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-zinc-900/70">
              <div>
                <FormLabel className={`text-base font-medium text-white ${isFieldRequired('assignments') ? 'required' : ''}`}>Assignments</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
                  {ASSIGNMENT_OPTIONS.map((option) => (
                    <FormField
                      key={option}
                      control={form.control}
                      name="assignments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, option]);
                                } else {
                                  field.onChange(field.value.filter((v) => v !== option));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal text-zinc-300">{option}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-6">
                <FormField
                  control={form.control}
                  name="recurringFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`text-base font-medium text-white ${isFieldRequired('recurringFees') ? 'required' : ''}`}>Recurring Fees</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter recurring fees" 
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nonRecurringFees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`text-base font-medium text-white ${isFieldRequired('nonRecurringFees') ? 'required' : ''}`}>Non-recurring Fees</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter non-recurring fees" 
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-zinc-900/80 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>
              <div className="flex gap-3">
                <SaveProgressButton 
                  onSave={() => saveFormData(form.getValues())}
                  variant="secondary"
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all duration-200"
                />
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2"
                >
                  <span>Next</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </motion.div>
  );
}
