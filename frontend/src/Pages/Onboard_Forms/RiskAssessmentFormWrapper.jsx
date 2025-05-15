import React from "react";
import { useParams } from "react-router-dom";
import RiskAssessmentForm from "./RiskAssessmentForm";

export default function RiskAssessmentFormWrapper() {
  const { applicationId } = useParams();
  return <RiskAssessmentForm applicationId={applicationId} />;
}
