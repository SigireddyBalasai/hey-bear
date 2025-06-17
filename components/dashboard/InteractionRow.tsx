import React, { memo } from 'react';
import { AlertTriangle, ExternalLink, MessageSquare, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { TransformedInteraction } from '@/types/interaction.types';
import { formatPhoneNumber } from '@/utils/phone-utils';
import { 
  formatMessage, 
  formatCostEstimate, 
  getInteractionTypeBadgeVariant,
  formatRelativeTime 
} from '@/utils/interaction-formatting';

interface InteractionRowProps {
  interaction: TransformedInteraction;
  onViewDetails?: (interaction: TransformedInteraction) => void;
}

export const InteractionRow = memo<InteractionRowProps>(({ interaction, onViewDetails }) => {
  const hasError = !!interaction.error_details;
  const TypeIcon = interaction.type === 'voice' ? Phone : MessageSquare;

  return (
    <TableRow className={hasError ? 'bg-red-50' : ''}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <TypeIcon className="h-4 w-4 text-gray-500" />
          <Badge variant={getInteractionTypeBadgeVariant(interaction.type)}>
            {interaction.type.toUpperCase()}
          </Badge>
          {hasError && (
            <AlertTriangle className="h-4 w-4 text-red-500" title="Error occurred" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {interaction.phone_number
            ? formatPhoneNumber(interaction.phone_number)
            : 'Unknown'}
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="text-sm font-medium text-gray-900">
            {formatMessage(interaction.user_message, 50)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="text-sm text-gray-600">
            {formatMessage(interaction.assistant_response, 50)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">
          {formatRelativeTime(interaction.interaction_time)}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">
          {interaction.token_usage || 0}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">
          {formatCostEstimate(interaction.cost_estimate)}
        </div>
      </TableCell>
      <TableCell>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(interaction)}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
});

InteractionRow.displayName = 'InteractionRow';
