import React from "react";
import { useParams } from "react-router-dom";
import FinaliseForm from "./FinaliseForm";
export default function FinaliseFormWrapper() {
  const { applicationId } = useParams();
  return <FinaliseForm applicationId={applicationId} />;
}
