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
  { path: "/onboarding/client-details", name: "Client Details" },
  { path: "/onboarding/trading-as", name: "Trading As" },
  { path: "/onboarding/referrals", name: "Referrals" },
  { path: "/onboarding/associations", name: "Associations" },
  { path: "/onboarding/assignments", name: "Assignments" },
  { path: "/onboarding/kyc", name: "KYC" },
  { path: "/onboarding/risk-assessment", name: "Risk Assessment" },
  { path: "/onboarding/non-audit", name: "Non-Audit" },
  { path: "/onboarding/finalise", name: "Finalise" },
];

export function OnboardingBreadcrumbs() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {steps.map((step, index) => (
          <BreadcrumbItem key={step.path}>
            {currentPath === step.path ? (
              <BreadcrumbPage>{step.name}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={step.path}>{step.name}</Link>
              </BreadcrumbLink>
            )}
            {index < steps.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}