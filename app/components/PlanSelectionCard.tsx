"use client";

import React from 'react';
import { Check, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlanSelectionCardProps {
  selectedPlan: string | null;
  onSelectPlan: (planId: string) => void;
}

export default function PlanSelectionCard({ selectedPlan, onSelectPlan }: PlanSelectionCardProps) {
  const plans = [
    {
      ...SUBSCRIPTION_PLANS.PERSONAL,
      description: "Perfect for personal use and individual projects",
      badge: null
    },
    {
      ...SUBSCRIPTION_PLANS.BUSINESS,
      description: "For professionals and businesses who need more capabilities",
      badge: "Popular"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
      {plans.map((plan) => (
        <Card 
          key={plan.id}
          className={`flex flex-col border-2 hover:shadow-md transition-all ${
            selectedPlan === plan.id 
              ? 'border-primary bg-primary/5' 
              : 'border-border'
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="mt-1">{plan.description}</CardDescription>
              </div>
              {plan.badge && (
                <Badge variant="secondary">{plan.badge}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 pb-2">
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
              <span className="text-muted-foreground ml-1">/month</span>
            </div>
            <ul className="space-y-2 text-sm">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 mt-4 text-xs text-muted-foreground cursor-help">
                    <Info className="h-3.5 w-3.5" />
                    <span>Non-refundable monthly subscription</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>This subscription is charged monthly and cannot be refunded. You can cancel anytime to avoid future charges.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
          <CardFooter>
            <Button
              variant={selectedPlan === plan.id ? "default" : "outline"}
              className="w-full"
              onClick={() => onSelectPlan(plan.id || '')}
            >
              {selectedPlan === plan.id ? "Selected" : "Select Plan"}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}