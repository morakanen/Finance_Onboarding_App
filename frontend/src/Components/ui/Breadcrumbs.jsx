// components/breadcrumbs.jsx
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const steps = [
  { pathBase: "/onboarding/client-details", name: "Client Details" },
  { pathBase: "/onboarding/trading-as", name: "Trading As" },
  { pathBase: "/onboarding/referrals", name: "Referrals" },
  { pathBase: "/onboarding/associations", name: "Associations" },
  { pathBase: "/onboarding/assignments", name: "Assignments" },
  { pathBase: "/onboarding/kyc", name: "KYC" },
  { pathBase: "/onboarding/risk-assessment", name: "Risk Assessment" },
  { pathBase: "/onboarding/non-audit", name: "Non-Audit" },
  { pathBase: "/onboarding/finalise", name: "Finalise" },
];

export function OnboardingBreadcrumbs() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Extract applicationId from the current path
  const pathParts = currentPath.split('/');
  const applicationId = pathParts[pathParts.length - 1];
  
  // Get the base path without the applicationId
  const currentPathBase = pathParts.slice(0, -1).join('/');

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {steps.map((step, index) => {
          // Create the full path with applicationId
          const fullPath = `${step.pathBase}/${applicationId}`;
          
          // Check if this step is the current one
          const isCurrentStep = currentPathBase === step.pathBase;
          
          return (
            <BreadcrumbItem key={step.pathBase}>
              {isCurrentStep ? (
                <BreadcrumbPage>{step.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={fullPath}>{step.name}</Link>
                </BreadcrumbLink>
              )}
              {index < steps.length - 1 && <BreadcrumbSeparator />}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}