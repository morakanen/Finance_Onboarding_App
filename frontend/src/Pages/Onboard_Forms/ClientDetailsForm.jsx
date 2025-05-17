import React, { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import * as z from "zod";
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


// 1️⃣ Define your validation schema with Zod:
const clientDetailsSchema = z.object({
  // -- Client Information --
  title: z.string().nonempty({ message: "Title is required" }),
  firstName: z.string().nonempty({ message: "First Name is required" }),
  middleName: z.string().optional(),
  lastName: z.string().nonempty({ message: "Last Name is required" }),
  salutation: z.string().optional(),
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
    <div className="mx-auto max-w-5xl w-full">
      <OnboardingBreadcrumbs />
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Client Details</h2>
          <p className="text-sm text-muted-foreground">
            Please fill in the client’s personal, address, and tax details.
          </p>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Top Row: Title, Names, Salutation, Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        {/* Example using Shadcn Select */}
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger data-testid="select-title" id="debug-title-select">
                            <SelectValue placeholder="Select Title" />
                          </SelectTrigger>
                          <SelectContent>
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
                      <FormLabel>Salutation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Dear John" {...field} />
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
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
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
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Michael" {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger data-testid="select-gender">
                            <SelectValue placeholder="Select Gender" />
                          </SelectTrigger>
                          <SelectContent>
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
              </div>

              {/* Address Section */}
              <h3 className="font-semibold text-lg">Main Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="addressLine1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Example St" {...field} />
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
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input placeholder="Apt #10" {...field} />
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
                      <FormLabel>Town</FormLabel>
                      <FormControl>
                        <Input placeholder="Norwich" {...field} />
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
                      <FormLabel>County</FormLabel>
                      <FormControl>
                        <Input placeholder="Norfolk" {...field} />
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
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="UK" {...field} />
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
                      <FormLabel>Postcode</FormLabel>
                      <FormControl>
                        <Input placeholder="AB12 3CD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Key Dates & Tax Info */}
              <h3 className="font-semibold text-lg">Tax and Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* DOB */}
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DOB</FormLabel>
                      <FormControl>
                        <Input placeholder="dd/mm/yyyy" {...field} />
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
                      <FormLabel>DOD</FormLabel>
                      <FormControl>
                        <Input placeholder="dd/mm/yyyy" {...field} />
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
                      <FormLabel>VAT Number</FormLabel>
                      <FormControl>
                        <Input placeholder="GB123456789" {...field} />
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
                      <FormLabel>NI Number</FormLabel>
                      <FormControl>
                        <Input placeholder="AB123456C" {...field} />
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
                      <FormLabel>UTR</FormLabel>
                      <FormControl>
                        <Input placeholder="Unique Taxpayer Reference" {...field} />
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
                      <FormLabel>Tax Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Tax Type" />
                          </SelectTrigger>
                          <SelectContent>
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
                      <FormLabel>Tax Investigation Cover</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Option" />
                          </SelectTrigger>
                          <SelectContent>
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
                      <FormLabel>Year End</FormLabel>
                      <FormControl>
                        <Input placeholder="dd/mm/yyyy" {...field} />
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
                      <FormLabel>Is VAT invoice required?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-4"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem data-testid="radio-isVatInvoiceRequired-yes" value="yes" />
                            <Label>Yes</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem data-testid="radio-isVatInvoiceRequired-no" value="no" />
                            <Label>No</Label>
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
                      <FormLabel>Is statement required?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-4"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem data-testid="radio-isVatInvoiceRequired-yes" value="yes" />
                            <Label>Yes</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem data-testid="radio-isVatInvoiceRequired-no" value="no" />
                            <Label>No</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Billing Address Toggle */}
              <h3 className="font-semibold text-lg">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Is billing address same as main address? */}
                <FormField
                  control={form.control}
                  name="isBillingSameAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Is billing address same as main address?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex gap-4"
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem data-testid="radio-isVatInvoiceRequired-yes" value="yes" />
                            <Label>Yes</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <RadioGroupItem data-testid="radio-isVatInvoiceRequired-no" value="no" />
                            <Label>No</Label>
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
                          <FormLabel>Billing Address Line 1</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Billing Rd" {...field} />
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
                          <FormLabel>Billing Address Line 2</FormLabel>
                          <FormControl>
                            <Input placeholder="Suite #10" {...field} />
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
                          <FormLabel>Billing Town</FormLabel>
                          <FormControl>
                            <Input placeholder="Norwich" {...field} />
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
                          <FormLabel>Billing County</FormLabel>
                          <FormControl>
                            <Input placeholder="Norfolk" {...field} />
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
                          <FormLabel>Billing Country</FormLabel>
                          <FormControl>
                            <Input placeholder="UK" {...field} />
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
                          <FormLabel>Billing Postcode</FormLabel>
                          <FormControl>
                            <Input placeholder="AB12 3CD" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* Contact Preferences */}
              <h3 className="font-semibold text-lg">Contact Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email Correspondence */}
                <FormField
                  control={form.control}
                  name="emailCorrespondence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Correspondence</FormLabel>
                      <FormControl>
                        <Input placeholder="Email for official notices" {...field} />
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
                      <FormLabel>Email Fee note</FormLabel>
                      <FormControl>
                        <Input placeholder="Email for fee notes" {...field} />
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
                      <FormLabel>Email VAT invoice</FormLabel>
                      <FormControl>
                        <Input placeholder="Email for VAT invoices" {...field} />
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
                      <FormLabel>Email Statement</FormLabel>
                      <FormControl>
                        <Input placeholder="Email for statements" {...field} />
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
                      <FormLabel>Back-up Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Backup or secondary email" {...field} />
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
                      <FormLabel>Telephone (1)</FormLabel>
                      <FormControl>
                        <Input placeholder="+44 1234 567890" {...field} />
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
                      <FormLabel>Telephone (2)</FormLabel>
                      <FormControl>
                        <Input placeholder="+44 1234 000000" {...field} />
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
                      <FormLabel>Mobile</FormLabel>
                      <FormControl>
                        <Input placeholder="+44 7777 123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>

            {/* Submit */}
            <CardFooter className="flex justify-between">
              <SaveProgressButton 
                onSave={() => saveFormData(form.getValues())}
                variant="secondary"
              />
              <Button type="submit" className="ml-auto">
                Save & Continue
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

export default ClientDetailsForm;
