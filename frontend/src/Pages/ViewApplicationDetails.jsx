import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import RiskAssessment from '@/components/RiskAssessment';

const ViewApplicationDetails = () => {
  const { applicationId } = useParams();
  const [applicationData, setApplicationData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch application details
        const appResponse = await fetch(`/api/applications/${applicationId}`);
        if (!appResponse.ok) throw new Error('Failed to fetch application data');
        const appData = await appResponse.json();
        setApplicationData(appData);

        // Fetch risk assessment with rule_weight parameter (default 0.5)
        const riskResponse = await fetch(`/api/applications/${applicationId}/risk-score?rule_weight=0.5`);
        if (!riskResponse.ok) throw new Error('Failed to fetch risk data');
        const riskData = await riskResponse.json();
        console.log('Risk assessment data received:', riskData);
        setRiskData(riskData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [applicationId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!applicationData) return <div>No application data found</div>;

  const {
    title,
    firstName,
    lastName,
    businessType,
    contactType,
    country,
    taxType,
  } = applicationData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Application Details</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Risk Assessment Card - Always Visible */}
        <div className="md:col-span-1">
          {riskData && <RiskAssessment
            ruleBasedScore={riskData.rule_based.score}
            mlBasedScore={riskData.ml_based.score}
            weightedScore={riskData.weighted.score}
            ruleBasedFactors={riskData.rule_based.factors}
            mlBasedFactors={riskData.ml_based.factors}
            weightedFactors={riskData.weighted.factors}
            comments={riskData.comments}
          />}
        </div>

        {/* Main Details Tabs - Takes 2/3 of width */}
        <div className="md:col-span-2">
          <Tabs defaultValue="client" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="client">Client</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
            </TabsList>

            <TabsContent value="client">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                  <CardDescription>Personal and contact details</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="font-medium">Name</dt>
                      <dd>{`${title} ${firstName} ${lastName}`}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Country</dt>
                      <dd>{country}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Tax Type</dt>
                      <dd>{taxType}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business">
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                  <CardDescription>Business structure and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="font-medium">Business Type</dt>
                      <dd>{businessType}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Contact Type</dt>
                      <dd>{contactType}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Recurring Fees</dt>
                      <dd>£{applicationData.recurring_fees?.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Non-recurring Fees</dt>
                      <dd>£{applicationData.non_recurring_fees?.toLocaleString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment Responses</CardTitle>
                  <CardDescription>Risk-related questions and answers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <dl className="space-y-4">
                      {[
                        { key: 'met_face_to_face', label: 'Met Face to Face' },
                        { key: 'visited_business_address', label: 'Visited Business Address' },
                        { key: 'is_uk_resident', label: 'UK Resident' },
                        { key: 'is_uk_national', label: 'UK National' },
                        { key: 'known_to_partner', label: 'Known to Partner' },
                        { key: 'reputable_referral', label: 'Reputable Referral' },
                        { key: 'plausible_wealth_level', label: 'Plausible Wealth Level' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <dt className="font-medium">{label}</dt>
                          <dd className={`capitalize ${applicationData[key] === 'yes' ? 'text-green-600' : 'text-red-600'}`}>
                            {applicationData[key]}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kyc">
              <Card>
                <CardHeader>
                  <CardTitle>KYC Information</CardTitle>
                  <CardDescription>Know Your Customer verification details</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <dl className="space-y-4">
                      {[
                        { key: 'identity_verified', label: 'Identity Verified' },
                        { key: 'evidence_recorded', label: 'Evidence Recorded' },
                        { key: 'client_honest_assessment', label: 'Client Honest Assessment' },
                        { key: 'wealth_plausible', label: 'Wealth Plausible' },
                        { key: 'adverse_records', label: 'Adverse Records' },
                        { key: 'beneficial_owners_verified', label: 'Beneficial Owners Verified' },
                        { key: 'other_identity_concerns', label: 'Other Identity Concerns' }
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <dt className="font-medium">{label}</dt>
                          <dd className={`capitalize ${
                            key === 'adverse_records' || key === 'other_identity_concerns'
                              ? applicationData[key] === 'no' ? 'text-green-600' : 'text-red-600'
                              : applicationData[key] === 'yes' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {applicationData[key]}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ViewApplicationDetails;
