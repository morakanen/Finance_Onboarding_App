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
  businessType: z.string().min(1),
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
});

export default function TradingAsForm() {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(tradingAsSchema),
    defaultValues: {
      businessType: "",
      companyName: "",
      registrationNumber: "",
    },
  });


  const onSubmit = (values) => {
    console.log("Trading As:", values);
    navigate("/onboarding/referrals");
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
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Sole Trader" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add other fields */}
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