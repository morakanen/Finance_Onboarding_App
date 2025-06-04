import React, { useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";

// Helper function to identify required fields
const isFieldRequired = () => true; // All fields in this form are required

const NONAUDIT_QUESTIONS = [
  {
    label: "Has the source of introduction been established?",
  },
  {
    label: "Has the name of the previous accountant been obtained?",
  },
  {
    label: "Have the reasons for changing accountants been explained?",
  },
  {
    label: "Do we know why the client has chosen our firm?",
  },
];

const nonAuditSchema = z.object({
  answers: z
    .array(
      z.object({
        response: z.enum(["yes", "no", "na"], { required_error: "Please select Yes, No or N/A" }),
        comment: z.string().min(1, "Comment is required"),
      })
    )
    .length(4),
});

export default function NonAuditForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(nonAuditSchema),
    defaultValues: {
      answers: NONAUDIT_QUESTIONS.map(() => ({ response: undefined, comment: "" })),
    },
  });
  useFieldArray({
    control: form.control,
    name: "answers",
  });

  // --- FORM STEP IDENTIFIER ---
  const step = "non-audit";
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
        navigate(`/onboarding/finalise/${effectiveAppId}`);
      }
    } catch (error) {
      console.error("Error saving non-audit form:", error);
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Non-Audit Checklist
            </h2>
            <p className="text-sm text-zinc-400">
              Please answer all questions and provide a comment for each
            </p>
          </CardHeader>
          <div className="text-orange-500 font-semibold px-6 pt-4 flex items-center bg-zinc-900/70 border-b border-zinc-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            All fields must be completed on this page before submission.
          </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-zinc-900/70">
              {NONAUDIT_QUESTIONS.map((q, idx) => (
                <div key={idx} className="mb-8 border-b border-zinc-800 pb-6 last:border-b-0">
                  <div className="flex flex-col space-y-4">
                    <div className="w-full">
                      <span className="font-medium text-white text-lg">{idx + 1}. {q.label}</span>
                    </div>
                    
                    <div className="w-full bg-zinc-800/50 p-4 rounded-md">
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name={`answers.${idx}.response`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300 font-medium mb-2 block">Response</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-row space-x-6"
                                >
                                  <div className="flex items-center">
                                    <RadioGroupItem value="yes" id={`yes-${idx}`} className="border-orange-500 text-orange-500" />
                                    <FormLabel htmlFor={`yes-${idx}`} className="ml-2 text-zinc-300">Yes</FormLabel>
                                  </div>
                                  <div className="flex items-center">
                                    <RadioGroupItem value="no" id={`no-${idx}`} className="border-orange-500 text-orange-500" />
                                    <FormLabel htmlFor={`no-${idx}`} className="ml-2 text-zinc-300">No</FormLabel>
                                  </div>
                                  <div className="flex items-center">
                                    <RadioGroupItem value="na" id={`na-${idx}`} className="border-orange-500 text-orange-500" />
                                    <FormLabel htmlFor={`na-${idx}`} className="ml-2 text-zinc-300">N/A</FormLabel>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="w-full">
                        <FormField
                          control={form.control}
                          name={`answers.${idx}.comment`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="required text-zinc-300 font-medium mb-2 block">Comment</FormLabel>
                              <FormControl>
                                <Textarea 
                                  {...field} 
                                  placeholder="Enter comment" 
                                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[80px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex flex-col md:flex-row md:justify-between gap-4 mt-4 bg-zinc-900/80 border-t border-zinc-800">
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Button>
              </div>
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
                  Next
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
    </motion.div>
  );
}
