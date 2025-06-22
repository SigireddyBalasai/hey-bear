'use client';

import { format, parseISO } from 'date-fns';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageRecord {
  id: string;
  user_id: string;
  assistant_id: string;
  interaction_type: 'chat' | 'sms' | 'call';
  tokens_used: number;
  cost: number;
  created_at: string;
  users: {
    email: string;
  };
  assistants: {
    name: string;
  };
}

interface UsageTableProps {
  filteredRecords: UsageRecord[];
  totalRecords: number;
}

export function UsageTable({ filteredRecords, totalRecords }: UsageTableProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);

  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Usage</CardTitle>
        <CardDescription>
          Showing {filteredRecords.length} of {totalRecords} total records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Assistant</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Tokens</th>
                <th className="text-left p-2">Cost</th>
                <th className="text-left p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.slice(0, 100).map(record => (
                <tr key={record.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{record.users?.email || 'Unknown'}</td>
                  <td className="p-2">{record.assistants?.name || 'Unknown'}</td>
                  <td className="p-2">
                    <Badge variant="secondary">{record.interaction_type}</Badge>
                  </td>
                  <td className="p-2">{formatNumber(record.tokens_used ?? 0)}</td>
                  <td className="p-2">{formatCurrency(record.cost ?? 0)}</td>
                  <td className="p-2">{format(parseISO(record.created_at), 'PPp')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
