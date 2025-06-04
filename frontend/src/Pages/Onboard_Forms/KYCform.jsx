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

const KYC_QUESTIONS = [
  {
    label: "Have we recorded adequate information concerning the identity of the client?",
    section: "Identity",
  },
  {
    label: "Have we undertaken and recorded appropriate evidence of identity as required by the firm's procedures?",
    section: "Identity",
  },
  {
    label: "Are we satisfied from the information available that the client is honest and reputable and that we are not dealing with an intermediary hiding the identity of another person?",
    section: "Integrity",
  },
  {
    label: "Note here (or cross ref) an explanation for any high levels of wealth. Is the level of wealth/corporate assets plausible/consistent with trading activities? In the case of individuals consider age, earnings, inheritances etc.",
    section: "Integrity",
  },
  {
    label: "Are there any adverse findings from public records or other due diligence checks?",
    section: "Due Diligence",
  },
  {
    label: "Have all beneficial owners/controllers been identified and verified?",
    section: "Beneficial Owners",
  },
  {
    label: "Are there any other matters to be brought to attention regarding the client's identity or integrity?",
    section: "Other",
  },
];

const kycSchema = z.object({
  answers: z
    .array(
      z.object({
        response: z.enum(["yes", "no"], { required_error: "Please select Yes or No" }),
        comment: z.string().min(1, "Comment is required"),
      })
    )
    .length(7),
});

export default function KYCForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      answers: KYC_QUESTIONS.map(() => ({ response: undefined, comment: "" })),
    },
  });
  const { fields } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  // --- FORM STEP IDENTIFIER ---
  const step = "kyc";
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
        navigate(`/onboarding/risk-assessment/${effectiveAppId}`);
      }
    } catch (error) {
      console.error("Error saving KYC form:", error);
      alert("Failed to save form data");
    }
  };

  // Group questions by section for display
  const grouped = KYC_QUESTIONS.reduce((acc, q, idx) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section].push({ ...q, idx });
    return acc;
  }, {});

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
              Know Your Client
            </h2>
            <p className="text-sm text-zinc-400">
              Please answer all questions and provide a comment for each
            </p>
          </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-zinc-900/70">
              {Object.entries(grouped).map(([section, questions]) => (
                <div key={section} className="mb-4">
                  <h3 className="font-bold mb-3 text-orange-500 border-b border-zinc-800 pb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {section}
                  </h3>
                  {questions.map((q) => (
                    <div key={q.idx} className="mb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                        <div className="md:w-2/3">
                          <span className="font-medium text-white">{q.idx + 1}. {q.label}</span>
                        </div>
                        <div className="md:w-1/6 mt-2 md:mt-0">
                          <FormField
                            control={form.control}
                            name={`answers.${q.idx}.response`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    className="flex flex-row space-x-4"
                                  >
                                    <div className="flex items-center">
                                      <RadioGroupItem value="yes" id={`yes-${q.idx}`} className="border-orange-500 text-orange-500" />
                                      <FormLabel htmlFor={`yes-${q.idx}`} className="ml-2 text-zinc-300">Yes</FormLabel>
                                    </div>
                                    <div className="flex items-center">
                                      <RadioGroupItem value="no" id={`no-${q.idx}`} className="border-orange-500 text-orange-500" />
                                      <FormLabel htmlFor={`no-${q.idx}`} className="ml-2 text-zinc-300">No</FormLabel>
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
                            name={`answers.${q.idx}.comment`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300 font-medium">Comment</FormLabel>
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
