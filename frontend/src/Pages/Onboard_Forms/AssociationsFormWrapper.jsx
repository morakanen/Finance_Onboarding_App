import React from "react";
import { useParams } from "react-router-dom";
import AssociationsForm from "./Associations";
export default function AssociationsFormWrapper() {
  const { applicationId } = useParams();
  return <AssociationsForm applicationId={applicationId} />;
}
