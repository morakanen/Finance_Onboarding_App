import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RiskAssessment = ({ 
  ruleBasedScore, 
  mlBasedScore, 
  weightedScore, 
  ruleBasedFactors, 
  mlBasedFactors, 
  weightedFactors,
  comments
}) => {
  // Simple function to determine risk level and color based on score
  const getRiskLevel = (score) => {
    // Ensure score is treated as a number
    const numericScore = parseFloat(score);
    
    // Determine risk level based on score thresholds
    if (numericScore >= 70) {
      return { level: 'High', color: 'bg-red-500', textColor: 'text-red-500' };
    } else if (numericScore >= 40) {
      return { level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    } else {
      return { level: 'Low', color: 'bg-green-500', textColor: 'text-green-500' };
    }
  };

  // Always calculate risk levels based on the numeric scores
  const ruleBased = getRiskLevel(ruleBasedScore);
  const mlBased = getRiskLevel(mlBasedScore);
  const weighted = getRiskLevel(weightedScore);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Risk Assessment
          {/* Force correct risk level display based on score */}
          {weightedScore >= 70 ? (
            <Badge className="bg-red-500 text-white">High Risk</Badge>
          ) : weightedScore >= 40 ? (
            <Badge className="bg-yellow-500 text-white">Medium Risk</Badge>
          ) : (
            <Badge className="bg-green-500 text-white">Low Risk</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Comprehensive risk analysis with weighted score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Weighted Score (Featured) */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium font-bold">Weighted Risk Score</span>
              <span className="text-sm font-medium font-bold">{weightedScore.toFixed(1)}/100</span>
            </div>
            <Progress 
              value={weightedScore} 
              className={`h-3 ${weightedScore >= 70 ? 'bg-red-500' : weightedScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} 
            />
            <p className="text-xs text-gray-500 mt-1">Combined rule-based and ML analysis</p>
          </div>

          {/* Comparison Scores */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* Rule-Based Score */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Rule Score</span>
                <span className="text-sm font-medium">{ruleBasedScore.toFixed(1)}</span>
              </div>
              <Progress value={ruleBasedScore} className={`h-2 ${ruleBased.color}`} />
            </div>

            {/* ML-Based Score */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">ML Score</span>
                <span className="text-sm font-medium">{mlBasedScore.toFixed(1)}</span>
              </div>
              <Progress value={mlBasedScore} className={`h-2 ${mlBased.color}`} />
            </div>
          </div>
          
          {/* Risk Factors Tabs */}
          <Tabs defaultValue="weighted" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weighted">Weighted</TabsTrigger>
              <TabsTrigger value="rule">Rule-Based</TabsTrigger>
              <TabsTrigger value="ml">ML-Based</TabsTrigger>
            </TabsList>
            
            {/* Weighted Factors */}
            <TabsContent value="weighted">
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-4">
                  {weightedFactors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${factor.impact === 'high' ? 'bg-red-500' : factor.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{factor.name}</p>
                        <p className="text-sm text-gray-500">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* Rule-Based Factors */}
            <TabsContent value="rule">
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-4">
                  {ruleBasedFactors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${factor.impact === 'high' ? 'bg-red-500' : factor.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{factor.name}</p>
                        <p className="text-sm text-gray-500">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {/* ML-Based Factors */}
            <TabsContent value="ml">
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="space-y-4">
                  {mlBasedFactors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className={`w-2 h-2 mt-1.5 rounded-full ${factor.impact === 'high' ? 'bg-red-500' : factor.impact === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{factor.name}</p>
                        <p className="text-sm text-gray-500">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      {comments && comments.length > 0 && (
        <CardFooter className="border-t bg-gray-50 pt-3 pb-3">
          <div className="w-full">
            <h4 className="text-sm font-semibold mb-2">Notes</h4>
            <ul className="text-xs space-y-1">
              {comments.map((comment, index) => (
                <li key={index} className="text-gray-600">{comment}</li>
              ))}
            </ul>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default RiskAssessment;
