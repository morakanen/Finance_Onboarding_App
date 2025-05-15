import React from "react";
import { useParams } from "react-router-dom";
import AssignmentsForm from "./Assignments";

export default function AssignmentsFormWrapper() {
  const { applicationId } = useParams();
  return <AssignmentsForm applicationId={applicationId} />;
}
