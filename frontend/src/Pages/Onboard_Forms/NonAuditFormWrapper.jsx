import React from "react";
import { useParams } from "react-router-dom";
import NonAuditForm from "./NonAuditForm";

export default function NonAuditFormWrapper() {
  const { applicationId } = useParams();
  return <NonAuditForm applicationId={applicationId} />;
}
