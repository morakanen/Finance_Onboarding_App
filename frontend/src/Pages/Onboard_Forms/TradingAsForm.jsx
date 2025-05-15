// TradingAsForm.jsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
// Shadcn UI form components
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";

const tradingAsSchema = z.object({
  contactType: z.string().min(1, "Contact type is required"),
  businessType: z.string().min(1, "Business type is required"),
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
});

import { useEffect, useRef } from "react";

export default function TradingAsForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(tradingAsSchema),
    defaultValues: {
      contactType: "",
      businessType: "",
      companyName: "",
      registrationNumber: "",
    },
  });

  // --- AUTOSAVE/LOAD LOGIC ---
  const step = "trading-as";
  const autosaveTimeout = useRef();
  useEffect(() => {
    if (!applicationId) return;
    fetch(`/api/form-progress/${applicationId}/${step}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.data) {
          form.reset(data.data);
        }
      });
    // eslint-disable-next-line
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId) return;
    const subscription = form.watch((values) => {
      if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
      autosaveTimeout.current = setTimeout(() => {
        fetch("/api/form-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            application_id: applicationId,
            step,
            data: values,
          }),
        });
      }, 800);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line
  }, [applicationId, form.watch]);

  const onSubmit = async (values) => {
    try {
      // Use the saveClientDetails API function to save data
      await fetch("/api/form-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: applicationId,
          step,
          data: values,
        }),
      });
      // Navigate to the next form with applicationId
      navigate(`/onboarding/referrals/${applicationId}`);
    } catch (error) {
      console.error("Error saving trading as form:", error);
      alert("Failed to save form data");
    }
  };

  return (
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Trading Information</h2>
          <p className="text-sm text-muted-foreground">
            Provide business details for sole traders
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="contactType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Contact Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Business Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sole_trader">Sole Trader</SelectItem>
                        <SelectItem value="limited_company">Limited Company</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="llp">LLP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter company name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reg No</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter registration number" />
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
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}