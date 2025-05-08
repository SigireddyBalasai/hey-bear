"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UnassignedNumbersWidget() {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchUnassignedNumbers();
  }, []);

  const fetchUnassignedNumbers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('is_assigned', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setNumbers(data || []);
    } catch (error) {
      console.error('Error fetching unassigned numbers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            <span>Unassigned Phone Numbers</span>
          </div>
        </CardTitle>
        <Badge variant={numbers.length > 0 ? "secondary" : "outline"}>
          {numbers.length}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-6 text-center">
            <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading numbers...</p>
          </div>
        ) : numbers.length === 0 ? (
          <div className="py-6 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-amber-500/70" />
            <p className="text-sm text-muted-foreground">No unassigned numbers available.</p>
            <p className="text-xs text-muted-foreground mt-1">Purchase new numbers to assign to No-show.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {numbers.slice(0, 5).map((number) => (
              <div key={number.id} className="text-sm flex justify-between items-center">
                <span className="font-mono">{number.number}</span>
                <Badge variant="outline" className="text-xs">
                  {new Date(number.created_at).toLocaleDateString()}
                </Badge>
              </div>
            ))}
            {numbers.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{numbers.length - 5} more numbers
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={() => router.push('/admin/phone-management')}
        >
          {numbers.length > 0 ? "Assign Numbers" : "Purchase Numbers"}
        </Button>
      </CardFooter>
    </Card>
  );
}
