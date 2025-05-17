import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Finalise</h2>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FormField
                  control={form.control}
                  name="preparedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form prepared by:</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter your name" />
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
                      <FormLabel>Partner approval:</FormLabel>
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
                      <FormLabel>MLRO/Deputy:</FormLabel>
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
            <CardFooter className="flex flex-col md:flex-row md:justify-between gap-4 mt-4">
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Previous
                </Button>
                <Button type="button" variant="outline">
                  Save and Exit
                </Button>
              </div>
              <div className="flex gap-2">
                <SaveProgressButton 
                  onSave={() => saveFormData(form.getValues())}
                  variant="secondary"
                />
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Submit for review
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
