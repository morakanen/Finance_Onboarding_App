import React from "react";
import { useParams } from "react-router-dom";
import ClientDetailsForm from "./ClientDetailsForm";

export default function ClientDetailsFormWrapper() {
  const { applicationId } = useParams();
  return <ClientDetailsForm applicationId={applicationId} />;
}
