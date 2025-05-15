import React from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingBreadcrumbs } from "@/components/ui/Breadcrumbs";

const NONAUDIT_QUESTIONS = [
  {
    label: "Has the source of introduction been established?",
  },
  {
    label: "Has the name of the previous accountant been obtained?",
  },
  {
    label: "Have the reasons for changing accountants been explained?",
  },
  {
    label: "Do we know why the client has chosen our firm?",
  },
];

const nonAuditSchema = z.object({
  answers: z
    .array(
      z.object({
        response: z.enum(["yes", "no", "na"], { required_error: "Please select Yes, No or N/A" }),
        comment: z.string().min(1, "Comment is required"),
      })
    )
    .length(4),
});

import { useEffect, useRef } from "react";

export default function NonAuditForm({ applicationId }) {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(nonAuditSchema),
    defaultValues: {
      answers: NONAUDIT_QUESTIONS.map(() => ({ response: undefined, comment: "" })),
    },
  });
  useFieldArray({
    control: form.control,
    name: "answers",
  });

  // --- AUTOSAVE/LOAD LOGIC ---
  const step = "non-audit";
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
      navigate(`/onboarding/finalise/${applicationId}`);
    } catch (error) {
      console.error("Error saving non-audit form:", error);
      alert("Failed to save form data");
    }
  };

  return (
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Non-Audit Checklist</h2>
          <p className="text-sm text-muted-foreground">
            Please answer all questions and provide a comment for each
          </p>
        </CardHeader>
        <div className="text-red-600 font-semibold px-6 pt-4">
          All fields must be completed on this page before submission.
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {NONAUDIT_QUESTIONS.map((q, idx) => (
                <div key={idx} className="mb-4">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                    <div className="md:w-2/3">
                      <span className="font-medium">{idx + 1}. {q.label}</span>
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
                                <RadioGroupItem value="yes" id={`yes-${idx}`} />
                                <FormLabel htmlFor={`yes-${idx}`}>Yes</FormLabel>
                                <RadioGroupItem value="no" id={`no-${idx}`} />
                                <FormLabel htmlFor={`no-${idx}`}>No</FormLabel>
                                <RadioGroupItem value="na" id={`na-${idx}`} />
                                <FormLabel htmlFor={`na-${idx}`}>N/A</FormLabel>
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
                            <FormLabel>Comment</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Enter comment" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
