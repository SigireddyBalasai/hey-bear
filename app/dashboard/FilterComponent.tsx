import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from './DataContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { Tables } from '@/lib/db.types';

interface FilterProps {
  setShowFilters: (show: boolean) => void;
}

type Assistant = Tables<'assistants'>;

const FilterComponent: React.FC<FilterProps> = ({ setShowFilters }) => {
  const { allInteractions, filterInteractions, assistantId, setAssistantId } = useData();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Calculate default dates (1 month ago to today)
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const [fromDate, setFromDate] = useState(oneMonthAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);
  
  // Fetch user's assistants
  useEffect(() => {
    async function fetchAssistants() {
      try {
        setIsLoading(true);
        const supabase = createClient();
        
        // First get the authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return;
        }
        
        // Get user ID from users table
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
          
        if (userDataError || !userData) {
          console.error('Error fetching user data:', userDataError);
          return;
        }
        
        // Fetch assistants belonging to this user
        const { data: assistantsData, error: assistantsError } = await supabase
          .from('assistants')
          .select('*')  // Select all fields to match the Assistant type
          .eq('user_id', userData.id);
        
        if (assistantsError) {
          console.error('Error fetching No-Show :', assistantsError);
          return;
        }
        
        if (assistantsData && assistantsData.length > 0) {
          setAssistants(assistantsData as Assistant[]);
        }
      } catch (error) {
        console.error('Error fetching assistants:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAssistants();
  }, []);
  
  const handleApplyFilters = () => {
    filterInteractions({ fromDate, toDate, assistantId: assistantId || undefined });
    setShowFilters(false);
  };

  const handleAssistantChange = (assistantId: string) => {
    setAssistantId(assistantId);
    filterInteractions({ fromDate, toDate, assistantId });
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-sm font-medium block mb-1">From Date</label>
            <Input 
              type="date" 
              value={fromDate} 
              onChange={(e) => setFromDate(e.target.value)} 
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">To Date</label>
            <Input 
              type="date" 
              value={toDate} 
              onChange={(e) => setToDate(e.target.value)} 
            />
          </div>
          <div>
            <h3 className="mb-2 font-medium">Concierge</h3>
            <RadioGroup 
              defaultValue={assistantId || 'all'} 
              className="flex flex-col space-y-1"
              onValueChange={handleAssistantChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="Concierge-all" />
                <Label htmlFor="Concierge-all">All No-show</Label>
              </div>
              
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading No-show...</div>
              ) : assistants.length > 0 ? (
                assistants.map(assistant => (
                  <div key={assistant.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={assistant.id} id={`assistant-${assistant.id}`} />
                    <Label htmlFor={`assistant-${assistant.id}`}>{assistant.name}</Label>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No No-Show found</div>
              )}
            </RadioGroup>
          </div>
          <div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterComponent;
