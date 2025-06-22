import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PhoneNumber {
  id: string;
  phone_number: string;
  twilio_sid: string | null;
  is_assigned: boolean | null;
  assistant_id: string | null;
  status: string | null;
  country: string | null;
  created_at: string;
}

interface PhoneNumbersTableProps {
  phoneNumbers: PhoneNumber[];
}

export function PhoneNumbersTable({ phoneNumbers }: PhoneNumbersTableProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getStatusBadge = (isAssigned: boolean | null, status: string | null) => {
    if (isAssigned) {
      return <Badge variant="secondary">Assigned</Badge>;
    }
    if (status === 'active') {
      return <Badge variant="outline">Available</Badge>;
    }

    return <Badge variant="destructive">Inactive</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phone Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Twilio SID</TableHead>
            <TableHead>Assistant ID</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {phoneNumbers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No phone numbers found. Click &quot;Import from Twilio&quot; to get started.
              </TableCell>
            </TableRow>
          ) : (
            phoneNumbers.map(number => (
              <TableRow key={number.id}>
                <TableCell className="font-medium">{number.phone_number}</TableCell>
                <TableCell>{getStatusBadge(number.is_assigned, number.status)}</TableCell>
                <TableCell>{number.country ?? 'N/A'}</TableCell>
                <TableCell className="font-mono text-sm">
                  {number.twilio_sid ? (
                    <span className="truncate">{number.twilio_sid}</span>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {number.assistant_id ? (
                    <span className="font-mono text-sm">{number.assistant_id}</span>
                  ) : (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(number.created_at)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
