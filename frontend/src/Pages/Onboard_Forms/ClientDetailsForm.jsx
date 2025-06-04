import React, { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import * as z from "zod";
import { motion } from "framer-motion";
import { saveFormProgress, loadFormData } from "../../utils/formUtils";
import SaveProgressButton from "../../components/SaveProgressButton";

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
import { saveClientDetails } from "@/utils/api";
import useAuthStore from "@/store/AuthStore";


// Helper function to identify required fields
const isFieldRequired = (fieldName) => {
  const optionalFields = [
    'middleName',
    'addressLine2',
    'county',
    'backupEmail',
    'telephone2',
    'mobile'
  ];
  return !optionalFields.includes(fieldName);
};

const clientDetailsSchema = z.object({
  // -- Client Information --
  title: z.string().nonempty({ message: "Title is required" }),
  firstName: z.string().nonempty({ message: "First Name is required" }),
  middleName: z.string().optional(),
  lastName: z.string().nonempty({ message: "Last Name is required" }),
  salutation: z.string().nonempty({ message: "Salutation is required" }),
  gender: z.string().nonempty({ message: "Gender is required" }),

  // -- Main Address --
  addressLine1: z.string().nonempty({ message: "Address Line 1 is required" }),
  addressLine2: z.string().optional(),
  town: z.string().nonempty({ message: "Town is required" }),
  county: z.string().optional(),
  country: z.string().nonempty({ message: "Country is required" }),
  postcode: z.string().nonempty({ message: "Postcode is required" }),

  // -- Key Dates & Tax Info --
  dob: z.string().nonempty({ message: "DOB is required" }),
  dod: z.string().nonempty({ message: "DOD is required" }),
  vatNumber: z.string().nonempty({ message: "VAT number is required" }),
  niNumber: z.string().nonempty({ message: "NI number is required" }),
  utr: z.string().nonempty({ message: "UTR is required" }),
  taxType: z.string().nonempty({ message: "Tax type is required" }),
  taxInvestigationCover: z.string().nonempty({ message: "Tax investigation cover is required" }),
  yearEnd: z.string().nonempty({ message: "Year end is required" }),
  isVatInvoiceRequired: z.enum(["yes", "no"]),
  isStatementRequired: z.enum(["yes", "no"]),

  // -- Billing Address Toggle --
  isBillingSameAddress: z.enum(["yes", "no"]),

  // -- If billing is different, we capture these:
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingTown: z.string().optional(),
  billingCounty: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPostcode: z.string().optional(),

  // -- Contact Preferences --
  emailCorrespondence: z.string().nonempty({ message: "Required" }),
  emailFeeNote: z.string().nonempty({ message: "Required" }),
  emailVatInvoice: z.string().nonempty({ message: "Required" }),
  emailStatement: z.string().nonempty({ message: "Required" }),
  backupEmail: z.string().nonempty({ message: "Required" }),
  telephone1: z.string().nonempty({ message: "Telephone 1 is required" }),
  telephone2: z.string().optional(),
  mobile: z.string().optional(),
});

function ClientDetailsForm({ applicationId }) { // applicationId now comes from URL params via wrapper
  const location = useLocation();
  const navigate = useNavigate();

  // 2️⃣ Setup your react-hook-form with the Zod resolver:
  const form = useForm({
    resolver: zodResolver(clientDetailsSchema),
    defaultValues: {
      // Pre-populate anything as needed
      title: "",
      firstName: "",
      middleName: "",
      lastName: "",
      salutation: "",
      gender: "",

      addressLine1: "",
      addressLine2: "",
      town: "",
      county: "",
      country: "",
      postcode: "",

      dob: "",
      dod: "",
      vatNumber: "",
      niNumber: "",
      utr: "",
      taxType: "",
      taxInvestigationCover: "",
      yearEnd: "",
      isVatInvoiceRequired: "no",
      isStatementRequired: "no",

      isBillingSameAddress: "yes",

      // Billing address starts empty
      billingAddressLine1: "",
      billingAddressLine2: "",
      billingTown: "",
      billingCounty: "",
      billingCountry: "",
      billingPostcode: "",

      emailCorrespondence: "",
      emailFeeNote: "",
      emailVatInvoice: "",
      emailStatement: "",
      backupEmail: "",
      telephone1: "",
      telephone2: "",
      mobile: "",
    },
  });

  // We "watch" the value of isBillingSameAddress to show/hide billing fields
  const isBillingSameAddress = useWatch({
    control: form.control,
    name: "isBillingSameAddress",
  });

  // Define step name for this form
  const step = "client-details";
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

  // 3️⃣ Handle form submission:
  async function onSubmit(values) {
    try {
      console.log("Submitting form with applicationId:", applicationId);
      console.log("Form values:", values);
      
      const saved = await saveFormData(values);
      if (saved) {
        // Navigate to the next form
        const effectiveAppId = applicationId || localStorage.getItem('currentApplicationId');
        navigate(`/onboarding/trading-as/${effectiveAppId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting the form. Please try again.");
    }
  }

  return (
    <motion.div 
      className="mx-auto max-w-5xl w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <OnboardingBreadcrumbs />
      <Card className="bg-zinc-900/90 border border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-zinc-800 to-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-white">Client Details</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Please provide your client details
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 bg-zinc-900/70">
              {/* Top Row: Title, Names, Salutation, Gender */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
              >
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Title</FormLabel>
                      <FormControl>
                        {/* Example using Shadcn Select */}
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500/20 focus:border-orange-500" 
                            data-testid="select-title" 
                            id="debug-title-select"
                          >
                            <SelectValue className="text-zinc-400" placeholder="Select Title" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem data-testid="select-title-option-Mr" value="Mr">Mr</SelectItem>
                            <SelectItem data-testid="select-title-option-Mrs" value="Mrs">Mrs</SelectItem>
                            <SelectItem data-testid="select-title-option-Ms" value="Ms">Ms</SelectItem>
                            <SelectItem data-testid="select-title-option-Dr" value="Dr">Dr</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Salutation */}
                <FormField
                  control={form.control}
                  name="salutation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Salutation</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="e.g. Dear John" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* First Name */}
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">First Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="John" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Middle Name */}
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Michael" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Last Name */}
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Doe" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Gender</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500/20 focus:border-orange-500" data-testid="select-gender">
                            <SelectValue className="text-zinc-400" placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem data-testid="select-gender-option-male" value="male">Male</SelectItem>
                            <SelectItem data-testid="select-gender-option-female" value="female">Female</SelectItem>
                            <SelectItem data-testid="select-gender-option-other" value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Address Section */}
              <h3 className="font-semibold text-lg text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Main Address
              </h3>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.3 }}
              >
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Address Line 1</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="123 Example St" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="addressLine2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Address Line 2</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Apt #10" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Town</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Norwich" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">County</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Norfolk" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Country</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="UK" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Postcode</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="AB12 3CD" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Key Dates & Tax Info */}
              <h3 className="font-semibold text-lg text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Tax and Personal Details
              </h3>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.4 }}
              >
                {/* DOB */}
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">DOB</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="dd/mm/yyyy" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* DOD */}
                <FormField
                  control={form.control}
                  name="dod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">DOD</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="dd/mm/yyyy" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* VAT Number */}
                <FormField
                  control={form.control}
                  name="vatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">VAT Number</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="GB123456789" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* NI Number */}
                <FormField
                  control={form.control}
                  name="niNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">NI Number</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="AB123456C" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* UTR */}
                <FormField
                  control={form.control}
                  name="utr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">UTR</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Unique Taxpayer Reference" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Tax Type */}
                <FormField
                  control={form.control}
                  name="taxType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Tax Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500/20 focus:border-orange-500">
                            <SelectValue className="text-zinc-400" placeholder="Select Tax Type" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem data-testid="select-taxType-option-selfAssessment" value="selfAssessment">Self Assessment</SelectItem>
                            <SelectItem data-testid="select-taxType-option-corporationTax" value="corporationTax">Corporation Tax</SelectItem>
                            <SelectItem data-testid="select-taxType-option-partnership" value="partnership">Partnership</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Tax Investigation Cover */}
                <FormField
                  control={form.control}
                  name="taxInvestigationCover"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Tax Investigation Cover</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className="bg-zinc-800 border-zinc-700 text-white focus:ring-orange-500/20 focus:border-orange-500">
                            <SelectValue className="text-zinc-400" placeholder="Select Option" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem data-testid="select-taxInvestigationCover-option-yes" value="yes">Yes</SelectItem>
                            <SelectItem data-testid="select-taxInvestigationCover-option-no" value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Year End */}
                <FormField
                  control={form.control}
                  name="yearEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Year End</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="dd/mm/yyyy" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is VAT Invoice Required? */}
                <FormField
                  control={form.control}
                  name="isVatInvoiceRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Is VAT invoice required?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-4"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-orange-500 text-orange-500" 
                              data-testid="radio-isVatInvoiceRequired-yes" 
                              value="yes"
                            />
                            <Label className="text-zinc-300">Yes</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-orange-500 text-orange-500" 
                              data-testid="radio-isVatInvoiceRequired-no" 
                              value="no"
                            />
                            <Label className="text-zinc-300">No</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Statement Required? */}
                <FormField
                  control={form.control}
                  name="isStatementRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Is statement required?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-4"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-orange-500 text-orange-500" 
                              data-testid="radio-isVatInvoiceRequired-yes" 
                              value="yes"
                            />
                            <Label className="text-zinc-300">Yes</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-orange-500 text-orange-500" 
                              data-testid="radio-isVatInvoiceRequired-no" 
                              value="no"
                            />
                            <Label className="text-zinc-300">No</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              {/* Billing Address Toggle */}
              <h3 className="font-semibold text-lg text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Billing Address
              </h3>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.5 }}
              >
                {/* Is billing address same as main address? */}
                <FormField
                  control={form.control}
                  name="isBillingSameAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Is billing address same as main address?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-4"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-orange-500 text-orange-500" 
                              data-testid="radio-isVatInvoiceRequired-yes" 
                              value="yes"
                            />
                            <Label className="text-zinc-300">Yes</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem
                              className="border-orange-500 text-orange-500" 
                              data-testid="radio-isVatInvoiceRequired-no" 
                              value="no"
                            />
                            <Label className="text-zinc-300">No</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* If user selects "no", reveal these fields: */}
                {isBillingSameAddress === "no" && (
                  <>
                    <FormField
                      control={form.control}
                      name="billingAddressLine1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 font-medium">Billing Address Line 1</FormLabel>
                          <FormControl>
                            <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="123 Billing Rd" 
                          {...field}
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingAddressLine2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 font-medium">Billing Address Line 2</FormLabel>
                          <FormControl>
                            <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Suite #10" 
                          {...field}
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingTown"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 font-medium">Billing Town</FormLabel>
                          <FormControl>
                            <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Norwich" 
                          {...field}
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingCounty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 font-medium">Billing County</FormLabel>
                          <FormControl>
                            <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Norfolk" 
                          {...field}
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingCountry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 font-medium">Billing Country</FormLabel>
                          <FormControl>
                            <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="UK" 
                          {...field}
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billingPostcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300 font-medium">Billing Postcode</FormLabel>
                          <FormControl>
                            <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="AB12 3CD" 
                          {...field}
                        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </motion.div>

              {/* Contact Preferences */}
              <h3 className="font-semibold text-lg text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Details
              </h3>
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.6 }}
              >
                {/* Email Correspondence */}
                <FormField
                  control={form.control}
                  name="emailCorrespondence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Email (Correspondence)</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Email for official notices" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email Fee Note */}
                <FormField
                  control={form.control}
                  name="emailFeeNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Email (Fee Note)</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Email for fee notes" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email VAT invoice */}
                <FormField
                  control={form.control}
                  name="emailVatInvoice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Email (VAT Invoice)</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Email for VAT invoices" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email Statement */}
                <FormField
                  control={form.control}
                  name="emailStatement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Email (Statement)</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Email for statements" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Backup Email */}
                <FormField
                  control={form.control}
                  name="backupEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Backup Email</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="Backup or secondary email" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Telephone (1) */}
                <FormField
                  control={form.control}
                  name="telephone1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Telephone 1</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="+44 1234 567890" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Telephone (2) */}
                <FormField
                  control={form.control}
                  name="telephone2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Telephone 2</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="+44 1234 000000" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Mobile */}
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-medium">Mobile</FormLabel>
                      <FormControl>
                        <Input
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-orange-500 focus:ring-orange-500/20" 
                          placeholder="+44 7777 123456" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            </CardContent>

            {/* Submit */}
            <CardFooter className="flex justify-between bg-gradient-to-b from-zinc-900 to-zinc-900/90 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <div className="flex gap-3">
                <SaveProgressButton 
                  onSave={async () => {
                    const values = form.getValues();
                    return await saveFormProgress('client-details', values, applicationId);
                  }}
                  variant="secondary"
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all duration-200"
                />
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <span>Save & Continue</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default ClientDetailsForm;
