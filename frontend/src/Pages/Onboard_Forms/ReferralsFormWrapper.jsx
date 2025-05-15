import React from "react";
import { useParams } from "react-router-dom";
import ReferralsForm from "./ReferralsForm";
export default function ReferralsFormWrapper() {
  const { applicationId } = useParams();
  return <ReferralsForm applicationId={applicationId} />;
}
