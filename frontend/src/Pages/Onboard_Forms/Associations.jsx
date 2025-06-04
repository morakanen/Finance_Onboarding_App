import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "framer-motion";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";

const MAX_ASSOCIATIONS = 10;

// Helper function to identify required fields
const isFieldRequired = (fieldName) => {
  const requiredFields = ['relationship', 'clientNumber'];
  return requiredFields.includes(fieldName);
};

const associationSchema = z.object({
  associations: z
    .array(
      z.object({
        relationship: z.string().min(1, "Relationship is required"),
        clientNumber: z.string().min(1, "Client number is required"),
      })
    )
    .max(MAX_ASSOCIATIONS, `You can add up to ${MAX_ASSOCIATIONS} relationships`),
});

export default function AssociationsForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      associations: [
        { relationship: "", clientNumber: "" },
        { relationship: "", clientNumber: "" },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "associations",
  });

  // --- AUTOSAVE/LOAD LOGIC ---
  const step = "associations";
  const autosaveTimeout = useRef();
  
  useEffect(() => {
    // If applicationId from URL params is missing, try to get from localStorage
    const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId') || "682af344-4b55-45f9-ac2e-6f72735d3ea4";
    
    if (!effectiveAppId) {
      console.error(`No application ID available for ${step} form`);
      return;
    }
    
    console.log(`Loading ${step} form data for application ID: ${effectiveAppId}`);
    
    fetch(`http://localhost:8000/api/form-progress/${effectiveAppId}/${step}`)
      .then(res => {
        console.log(`${step} form data response status:`, res.status);
        if (!res.ok) {
          if (res.status === 404) {
            console.log(`No data found for ${step}, this is normal for a new form`);
            return null;
          }
          console.error(`Error fetching ${step} data:`, res.status, res.statusText);
          return null;
        }
        return res.json();
      })
      .then(data => {
        console.log(`${step} form data retrieved:`, data);
        if (data && data.data) {
          console.log(`Resetting ${step} form with data:`, data.data);
          form.reset(data.data);
        } else {
          console.log(`No saved data found for ${step}`);
        }
      })
      .catch(err => console.error(`Error loading ${step} form data:`, err));
    // eslint-disable-next-line
  }, [applicationId]);

  useEffect(() => {
    // If applicationId from URL params is missing, try to get from localStorage
    const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId') || "682af344-4b55-45f9-ac2e-6f72735d3ea4";
    
    if (!effectiveAppId) {
      console.error(`No application ID available for ${step} form autosave`);
      return;
    }
    
    const subscription = form.watch((values) => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
      autosaveTimeout.current = setTimeout(() => {
        console.log(`Autosaving ${step} form data for application ID: ${effectiveAppId}`);
        fetch("http://localhost:8000/api/form-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: effectiveAppId,
            step,
            data: values,
          }),
        })
        .then(res => {
          console.log(`Autosave response for ${step}:`, res.status);
          return res.ok ? res.json() : null;
        })
        .catch(err => console.error(`Error autosaving ${step} form data:`, err));
      }, 800);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line
  }, [applicationId, form.watch]);

  // Function to save form data without navigating
  const saveFormData = async (values) => {
    try {
      // Get the effective application ID
      const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId') || "682af344-4b55-45f9-ac2e-6f72735d3ea4";
      
      if (!effectiveAppId) {
        console.error(`No application ID available for ${step} form save`);
        alert("No application ID found. Please return to dashboard and try again.");
        return false;
      }
      
      console.log(`Saving ${step} form data for application ID: ${effectiveAppId}`);
      
      // Save form data to the database
      const response = await fetch("http://localhost:8000/api/form-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: effectiveAppId,
          step,
          data: values,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      console.log(`Successfully saved ${step} form data`);
      return true;
    } catch (error) {
      console.error(`Error saving ${step} form:`, error);
      alert("Failed to save form data: " + error.message);
      return false;
    }
  };

  // Submit handler - save and navigate to next form
  const onSubmit = async (values) => {
    const saved = await saveFormData(values);
    if (saved) {
      // Navigate to the next form with applicationId
      const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId') || "682af344-4b55-45f9-ac2e-6f72735d3ea4";
      navigate(`/onboarding/assignments/${effectiveAppId}`);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Associations
          </h2>
          <p className="text-sm text-zinc-400">
            Add relationships with existing clients (up to {MAX_ASSOCIATIONS})
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-zinc-900/70">
              {fields.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <FormField
                    control={form.control}
                    name={`associations.${idx}.relationship`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={`text-base font-medium text-white ${isFieldRequired('relationship') ? 'required' : ''}`}>Relationship</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500/20">
                              <SelectValue placeholder="Select relationship type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="director">Director</SelectItem>
                            <SelectItem value="shareholder">Shareholder</SelectItem>
                            <SelectItem value="partner">Partner</SelectItem>
                            <SelectItem value="trustee">Trustee</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`associations.${idx}.clientNumber`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={`text-base font-medium text-white ${isFieldRequired('clientNumber') ? 'required' : ''}`}>Client Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter client number" 
                            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-2 md:mt-6 md:self-start bg-red-600/80 hover:bg-red-700 text-white"
                      onClick={() => remove(idx)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </Button>
                  )}
                </motion.div>
              ))}
              {fields.length < MAX_ASSOCIATIONS && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2"
                  onClick={() => append({ relationship: "", clientNumber: "" })}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add another relationship
                </Button>
              )}
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
