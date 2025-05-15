import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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

import { useEffect, useRef } from "react";

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
      // Save form data to the database
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
      navigate(`/onboarding/assignments/${applicationId}`);
    } catch (error) {
      console.error("Error saving associations form:", error);
      alert("Failed to save form data");
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
                        <FormLabel>Relationship</FormLabel>
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
                        <FormLabel>of client number</FormLabel>
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
              <Button type="submit">Next</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
