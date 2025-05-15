import React from "react";
import { useParams } from "react-router-dom";
import TradingAsForm from "./TradingAsForm";
export default function TradingAsFormWrapper() {
  const { applicationId } = useParams();
  return <TradingAsForm applicationId={applicationId} />;
}
