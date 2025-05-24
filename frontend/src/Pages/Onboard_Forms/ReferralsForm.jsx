import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { saveFormProgress, loadFormData } from "../../utils/formUtils";
import SaveProgressButton from "../../components/SaveProgressButton";
// Shadcn UI form components
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";

// Helper function to identify required fields
const isFieldRequired = (fieldName) => {
  const requiredFields = ['introductoryCategory', 'sector'];
  return requiredFields.includes(fieldName);
};

const referralsSchema = z.object({
  introductoryCategory: z.string().min(1, "Introductory Category is required"),
  sector: z.string().min(1, "Sector is required"),
  professionalReferral: z.string().optional(),
  referredBy: z.string().optional(),
});

export default function ReferralsForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(referralsSchema),
    defaultValues: {
      introductoryCategory: "",
      sector: "",
      professionalReferral: "",
      referredBy: "",
    },
  });

  // --- FORM STEP IDENTIFIER ---
  const step = "referrals";
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
        // Using direct backend URL (http://localhost:8000) instead of /api prefix
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
        const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId');
        navigate(`/onboarding/associations/${effectiveAppId}`);
      }
    } catch (error) {
      console.error("Error saving referrals form:", error);
      alert("Failed to save form data");
    }
  };

  return (
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Referrals</h2>
          <p className="text-sm text-muted-foreground">
            Please provide referral details
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="introductoryCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={isFieldRequired('introductoryCategory') ? 'required' : ''}>Introductory Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Introductory category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ifa">IFA</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="solicitor">Solicitor</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={isFieldRequired('sector') ? 'required' : ''}>Sector</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="financial">Financial</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="property">Property</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="professionalReferral"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Referral</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter professional referral" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referredBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referred by</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter referred by" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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