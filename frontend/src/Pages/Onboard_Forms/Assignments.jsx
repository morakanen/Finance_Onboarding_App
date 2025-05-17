import React, { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Assignments</h2>
          <p className="text-sm text-muted-foreground">
            Please select the work to be undertaken and enter estimated fees
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div>
                <FormLabel className="font-bold">Assignments</FormLabel>
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
                          <FormLabel className="font-normal">{option}</FormLabel>
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
                      <FormLabel>Recurring fees*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter recurring fees" />
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
                      <FormLabel>Non-recurring fees*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter non-recurring fees" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
