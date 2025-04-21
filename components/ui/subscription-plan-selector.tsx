import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice, SUBSCRIPTION_PLANS } from "@/lib/stripe";
import { CreditCard, Check, AlertCircle } from "lucide-react";

interface SubscriptionPlanSelectorProps {
  selectedPlan: string;
  onSelectPlan: (plan: string) => void;
}

export function SubscriptionPlanSelector({ 
  selectedPlan, 
  onSelectPlan 
}: SubscriptionPlanSelectorProps) {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Select a Subscription Plan</h3>
        <p className="text-sm text-muted-foreground">
          Each bot requires its own subscription
        </p>
      </div>

      <RadioGroup
        value={selectedPlan}
        onValueChange={onSelectPlan}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Personal Plan */}
        <div>
          <RadioGroupItem
            value="personal"
            id="personal"
            className="peer sr-only"
          />
          <Label
            htmlFor="personal"
            className="flex flex-col h-full"
          >
            <Card className={cn(
              "cursor-pointer border-2 h-full",
              selectedPlan === "personal" 
                ? "border-primary" 
                : "border-muted"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {SUBSCRIPTION_PLANS.PERSONAL.name}
                  <Badge variant="outline" className="ml-2">
                    {formatPrice(SUBSCRIPTION_PLANS.PERSONAL.price)}/mo
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {SUBSCRIPTION_PLANS.PERSONAL.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Basic document processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Standard response times</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Label>
        </div>

        {/* Business Plan */}
        <div>
          <RadioGroupItem
            value="business"
            id="business"
            className="peer sr-only"
          />
          <Label
            htmlFor="business"
            className="flex flex-col h-full"
          >
            <Card className={cn(
              "cursor-pointer border-2 h-full",
              selectedPlan === "business" 
                ? "border-primary" 
                : "border-muted"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {SUBSCRIPTION_PLANS.BUSINESS.name}
                  <Badge variant="outline" className="ml-2">
                    {formatPrice(SUBSCRIPTION_PLANS.BUSINESS.price)}/mo
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {SUBSCRIPTION_PLANS.BUSINESS.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Priority document processing</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Faster response times</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Enhanced support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </Label>
        </div>
      </RadioGroup>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Subscription Notice</p>
            <p className="mt-1">
              Each bot requires its own subscription. You will be charged immediately upon creating a bot and subscriptions are non-refundable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}