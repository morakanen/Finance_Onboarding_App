import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
import { saveFormProgress, loadFormData } from "../../utils/formUtils";
import { updateApplicationStatus } from "../../utils/api";
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
import { Select, SelectItem, SelectContent } from "@/components/ui/select";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";
import { DocumentUpload } from "@/components/DocumentUpload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PARTNER_OPTIONS = ["Partner", "Other Partner 1", "Other Partner 2"];
const MLRO_OPTIONS = ["MLRO/Deputy", "Other MLRO 1", "Other MLRO 2"];

const finaliseSchema = z.object({
  preparedBy: z.string().min(1, "Required"),
  partnerApproval: z.string().min(1, "Required"),
  partnerSignoffDate: z.string().min(1, "Required"),
  mlroDeputy: z.string().min(1, "Required"),
  mlroSignoffDate: z.string().min(1, "Required"),
});

export default function FinaliseForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(finaliseSchema),
    defaultValues: {
      preparedBy: "",
      partnerApproval: PARTNER_OPTIONS[0],
      partnerSignoffDate: "",
      mlroDeputy: MLRO_OPTIONS[0],
      mlroSignoffDate: "",
    },
  });

  // --- FORM STEP IDENTIFIER ---
  const step = "finalise";
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

  // Autosave on form change (debounced)
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
      }, 800); // 800ms debounce
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line
  }, [applicationId, form.watch]);

  const [uploadError, setUploadError] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  // Load existing documents when component mounts
  useEffect(() => {
    if (!applicationId) return;
    
    fetch(`http://localhost:8000/api/list-documents/${applicationId}`)
      .then(response => response.json())
      .then(documents => {
        if (!Array.isArray(documents)) return;
        setUploadedDocuments(documents);
      })
      .catch(error => {
        console.error('Error loading documents:', error);
        setUploadError('Failed to load existing documents');
      });
  }, [applicationId]);

  const handleUploadComplete = (data) => {
    setUploadedDocuments(prev => [...prev, data]);
    setUploadError(null);
  };

  const onSubmit = async (values) => {
    try {
      const saved = await saveFormData(values);
      if (saved) {
        // Update application status to completed
        await updateApplicationStatus(applicationId, 'completed');
        // Navigate to the dashboard after completing all forms
        navigate('/dashboard');
        alert("Onboarding process completed successfully!");
      }
    } catch (error) {
      console.error("Error saving finalise form:", error);
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
        <Card className="mb-6 bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Required Documents
            </h3>
            <p className="text-sm text-zinc-400">
              Please upload any relevant documents for this application
            </p>
          </CardHeader>
        <CardContent className="bg-zinc-900/70">
          {uploadError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          <DocumentUpload
            applicationId={applicationId}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-800">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Finalise
            </h2>
          </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-zinc-900/70">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FormField
                  control={form.control}
                  name="preparedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-white">Form prepared by:</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your name" 
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partnerApproval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-white">Partner approval:</FormLabel>
                      <FormControl>
                        <Select {...field} value={field.value} onValueChange={field.onChange}>
                          <SelectContent>
                            {PARTNER_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="partnerSignoffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of sign-off:</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mlroDeputy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-white">MLRO/Deputy:</FormLabel>
                      <FormControl>
                        <Select {...field} value={field.value} onValueChange={field.onChange}>
                          <SelectContent>
                            {MLRO_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mlroSignoffDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of sign-off:</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button 
                  type="button" 
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all duration-200"
                >
                  Save and Exit
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
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit for review
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
