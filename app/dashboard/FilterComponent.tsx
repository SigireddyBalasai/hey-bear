import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from './DataContext';

interface FilterProps {
  setShowFilters: (show: boolean) => void;
}

const FilterComponent: React.FC<FilterProps> = ({ setShowFilters }) => {
  const { allInteractions, filterInteractions } = useData();
  
  // Calculate default dates (1 month ago to today)
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const [fromDate, setFromDate] = useState(oneMonthAgo.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today.toISOString().split('T')[0]);
  const [phoneNumber, setPhoneNumber] = useState('all');
  const [uniquePhoneNumbers, setUniquePhoneNumbers] = useState<string[]>([]);
  
  // Extract unique phone numbers when interactions change
  useEffect(() => {
    if (allInteractions.length > 0) {
      setUniquePhoneNumbers(Array.from(new Set(allInteractions.map(i => i.phoneNumber))));
    }
  }, [allInteractions]);
  
  const handleApplyFilters = () => {
    filterInteractions({ fromDate, toDate, phoneNumber });
    setShowFilters(false);
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
            <label className="text-sm font-medium block mb-1">Phone Number</label>
            <Select 
              value={phoneNumber} 
              onValueChange={setPhoneNumber}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Phone Numbers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phone Numbers</SelectItem>
                {uniquePhoneNumbers.map((phone) => (
                  <SelectItem key={phone} value={phone}>{phone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
