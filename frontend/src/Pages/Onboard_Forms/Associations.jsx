import React, { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Associations</h2>
          <p className="text-sm text-muted-foreground">
            Add relationships with existing clients (up to {MAX_ASSOCIATIONS})
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {fields.map((item, idx) => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                  <FormField
                    control={form.control}
                    name={`associations.${idx}.relationship`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className={isFieldRequired('relationship') ? 'required' : ''}>Relationship</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Relationship" />
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
                        <FormLabel className={isFieldRequired('clientNumber') ? 'required' : ''}>Client Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter client number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length > 2 && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="mt-2 md:mt-6 md:self-start"
                      onClick={() => remove(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {fields.length < MAX_ASSOCIATIONS && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2"
                  onClick={() => append({ relationship: "", clientNumber: "" })}
                >
                  Add another relationship
                </Button>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Previous
              </Button>
              <div className="flex gap-2">
                <SaveProgressButton 
                  onSave={() => saveFormData(form.getValues())}
                  variant="secondary"
                />
                <Button type="submit">Next</Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
