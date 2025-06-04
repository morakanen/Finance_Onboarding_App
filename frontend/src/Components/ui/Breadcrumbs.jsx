// components/breadcrumbs.jsx
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ChevronRight } from "lucide-react";
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
  
  // Find the current step index
  const currentStepIndex = steps.findIndex(step => step.pathBase === currentPathBase);

  return (
    <motion.div 
      className="mb-6 mt-6 pt-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress bar */}
      <div className="w-full h-2 bg-zinc-800 rounded-full mb-3 relative overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(((currentStepIndex + 1) / steps.length) * 100, 5)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      {/* Breadcrumb navigation */}
      <div className="bg-zinc-900/50 rounded-md p-2 overflow-x-auto">
        <Breadcrumb>
          <BreadcrumbList className="flex items-center text-sm whitespace-nowrap min-w-max">
            {steps.map((step, index) => {
              // Create the full path with applicationId
              const fullPath = `${step.pathBase}/${applicationId}`;
              
              // Check if this step is the current one or completed
              const isCurrentStep = currentPathBase === step.pathBase;
              const isCompleted = index < currentStepIndex;
              const isClickable = true; // Allow clicking on all steps
              
              return (
                <BreadcrumbItem key={step.pathBase} className="flex items-center text-xs">
                  {isCurrentStep ? (
                    <BreadcrumbPage className="flex items-center">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full mr-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
                        <span className="text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-white font-medium">{step.name}</span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link 
                        to={fullPath} 
                        className="flex items-center hover:text-white transition-colors duration-200 group"
                      >
                        <div className={`flex items-center justify-center w-5 h-5 rounded-full mr-1.5 transition-colors duration-200 ${isCompleted ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30' : 'bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white'}`}>
                          {isCompleted ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <span className="text-xs">{index + 1}</span>
                          )}
                        </div>
                        <span className={isCompleted ? 'text-zinc-300' : 'text-zinc-400'}>{step.name}</span>
                      </Link>
                    </BreadcrumbLink>
                  )}
                  {index < steps.length - 1 && (
                    <BreadcrumbSeparator className="mx-0.5">
                      <ChevronRight className="w-3 h-3 text-zinc-600" />
                    </BreadcrumbSeparator>
                  )}
                </BreadcrumbItem>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </motion.div>
  );
}