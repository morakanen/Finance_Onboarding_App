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

import { useEffect, useRef } from "react";

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

  // --- AUTOSAVE/LOAD LOGIC ---
  const step = "kyc";
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
      navigate(`/onboarding/risk-assessment/${applicationId}`);
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
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Know Your Client</h2>
          <p className="text-sm text-muted-foreground">
            Please answer all questions and provide a comment for each
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {Object.entries(grouped).map(([section, questions]) => (
                <div key={section} className="mb-4">
                  <h3 className="font-bold mb-2">{section}</h3>
                  {questions.map((q) => (
                    <div key={q.idx} className="mb-4">
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
                        <div className="md:w-2/3">
                          <span className="font-medium">{q.idx + 1}. {q.label}</span>
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
                                    <RadioGroupItem value="yes" id={`yes-${q.idx}`} />
                                    <FormLabel htmlFor={`yes-${q.idx}`}>Yes</FormLabel>
                                    <RadioGroupItem value="no" id={`no-${q.idx}`} />
                                    <FormLabel htmlFor={`no-${q.idx}`}>No</FormLabel>
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
