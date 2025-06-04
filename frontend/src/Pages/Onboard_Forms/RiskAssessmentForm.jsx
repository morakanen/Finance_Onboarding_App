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

const RISK_QUESTIONS = [
  {
    label: "Have we met the client face to face?",
  },
  {
    label: "Have we visited the client at their usual residential or business address?",
  },
  {
    label: "Is the client resident in UK?",
  },
  {
    label: "Is client a UK national?",
  },
  {
    label: "Was client previously known to a partner or manager, or is it a well-known local business?",
  },
  {
    label: "Has client been referred by reputable source?",
  },
  {
    label: "Do we have reasonable belief that the client's levels of wealth have a plausible explanation?",
  },
];

const riskSchema = z.object({
  answers: z
    .array(
      z.object({
        response: z.enum(["yes", "no"], { required_error: "Please select Yes or No" }),
        comment: z.string().min(1, "Comment is required"),
      })
    )
    .length(7),
});


export default function RiskAssessmentForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      answers: RISK_QUESTIONS.map(() => ({ response: undefined, comment: "" })),
    },
  });
  useFieldArray({
    control: form.control,
    name: "answers",
  });

  // --- FORM STEP IDENTIFIER ---
  const step = "risk-assessment";
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
      // Simple risk logic: if any answer is "no", risk is high
      const riskScore = values.answers.every((a) => a.response === "yes") ? 1 : 0;
      form.setValue("riskScore", riskScore);
      form.setValue("riskMessage", riskScore === 1 ? "Risk is low." : "Risk is high. Refer to Gary Flatt.");
      
      const formData = form.getValues();
      
      // Save form data using our utility function
      const saved = await saveFormData(formData);
      if (saved) {
        // Navigate to the next form with applicationId
        const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId');
        navigate(`/onboarding/non-audit/${effectiveAppId}`);
      }
    } catch (error) {
      console.error("Error saving risk assessment form:", error);
      alert("Failed to save form data");
    }
  };

  // Calculate risk for display
  const answers = form.watch("answers");
  const riskScore = answers?.every((a) => a.response === "yes") ? 1 : 0;
  const riskMessage = riskScore === 1 ? "Risk is low." : "Risk is high. Refer to Gary Flatt.";

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Risk Assessment
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
              {RISK_QUESTIONS.map((q, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                    <div className="md:w-2/3">
                      <span className="font-medium text-white">{idx + 1}. {q.label}</span>
                    </div>
                    <div className="md:w-1/6 mt-2 md:mt-0">
                      <FormField
                        control={form.control}
                        name={`answers.${idx}.response`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-row space-x-4"
                              >
                                <div className="flex items-center">
                                  <RadioGroupItem value="yes" id={`yes-${idx}`} className="border-orange-500 text-orange-500" />
                                  <FormLabel htmlFor={`yes-${idx}`} className="ml-2 text-zinc-300">Yes</FormLabel>
                                </div>
                                <div className="flex items-center">
                                  <RadioGroupItem value="no" id={`no-${idx}`} className="border-orange-500 text-orange-500" />
                                  <FormLabel htmlFor={`no-${idx}`} className="ml-2 text-zinc-300">No</FormLabel>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="md:w-1/3 mt-2 md:mt-0">
                      <FormField
                        control={form.control}
                        name={`answers.${idx}.comment`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="required text-zinc-300 font-medium">Response</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Enter comment" 
                                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {/* Risk summary box */}
              <div className="border border-orange-600/50 rounded-md p-4 mt-8 bg-zinc-800/50 shadow-inner">
                <div className="font-semibold text-white">
                  Client is assessed as: <span className="text-orange-500 font-mono">{riskScore}</span>
                </div>
                <div className="text-orange-500 font-bold mt-2">{riskMessage}</div>
              </div>
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
