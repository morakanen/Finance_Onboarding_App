import React from "react";
import { useParams } from "react-router-dom";
import KYCForm from "./KYCform";

export default function KYCFormWrapper() {
  const { applicationId } = useParams();
  return <KYCForm applicationId={applicationId} />;
}
