"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from './DataContext';

export interface StatCardProps {
  title: string;
  description: string;
  value?: string | number;
  isLoading?: boolean;
  metricType?: string;
}

const StatCard = ({ 
  title, 
  value: propValue, 
  description, 
  isLoading: propIsLoading, 
  metricType 
}: StatCardProps) => {
  const [localValue, setLocalValue] = useState<string | number>('');
  const [isLoading, setIsLoading] = useState(propIsLoading ?? Boolean(metricType));
  
  const { dateRange } = useData();
  
  // If metricType is provided, fetch the data dynamically
  useEffect(() => {
    if (!metricType) return;
    
    const fetchMetric = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, we would fetch from an API
        // For now, use mock data based on the metricType
        setTimeout(() => {
          switch(metricType) {
            case 'totalInteractions':
              setLocalValue(342);
              break;
            case 'activeContacts':
              setLocalValue(78);
              break;
            case 'interactionsPerContact':
              setLocalValue(4.3);
              break;
            case 'averageResponseTime':
              setLocalValue('1.2m');
              break;
            default:
              setLocalValue(0);
          }
          setIsLoading(false);
        }, 800); // Simulated API delay
      } catch (error) {
        console.error('Error fetching metric:', error);
        setIsLoading(false);
      }
    };
    
    fetchMetric();
  }, [metricType, dateRange]);
  
  // Determine the value to display - either from props or from fetched data
  const displayValue = propValue !== undefined ? propValue : localValue;
  
  // Format the value for display
  const getFormattedValue = () => {
    if (isLoading) return '--';
    
    if (typeof displayValue === 'number') {
      // For numeric values, format with commas for thousands
      return displayValue.toLocaleString();
    }
    
    return displayValue;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{getFormattedValue()}</div>
        )}
        <CardDescription className="mt-1 text-xs">{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

export default StatCard;
