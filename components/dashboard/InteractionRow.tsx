import { AlertTriangle, ExternalLink, MessageSquare, Phone } from 'lucide-react';
import React, { memo } from 'react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import type { InteractionRow as InteractionData } from '@/types/interaction.types';
import {
  extractAssistantResponse,
  extractMessageType,
  extractPhoneNumber,
  extractUserMessage,
  formatCostEstimate,
  formatMessage,
  formatRelativeTime,
  getInteractionTypeBadgeVariant,
} from '@/utils/interaction-formatting';
import { formatPhoneNumber } from '@/utils/phone-utils';

interface InteractionRowProps {
  interaction: InteractionData;
  onViewDetails?: (interaction: InteractionData) => void;
}

export const InteractionRow = memo<InteractionRowProps>(({ interaction, onViewDetails }) => {
  const hasError = Boolean(interaction.is_error);
  const messageType = extractMessageType(interaction);
  const TypeIcon = messageType === 'voice' ? Phone : MessageSquare;
  const phoneNumber = extractPhoneNumber(interaction);
  const userMessage = extractUserMessage(interaction);
  const assistantResponse = extractAssistantResponse(interaction);

  return (
    <TableRow className={hasError ? 'bg-red-50' : ''}>
      <TableCell>
        <div className="flex items-center space-x-2">
          <TypeIcon className="h-4 w-4 text-gray-500" />
          <Badge variant={getInteractionTypeBadgeVariant(messageType)}>
            {messageType.toUpperCase()}
          </Badge>
          {hasError && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm">{phoneNumber ? formatPhoneNumber(phoneNumber) : 'Unknown'}</div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="text-sm font-medium text-gray-900">{formatMessage(userMessage, 50)}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="max-w-xs">
          <div className="text-sm text-gray-600">{formatMessage(assistantResponse, 50)}</div>
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">
          {formatRelativeTime(interaction.interaction_time)}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">{interaction.token_usage || 0}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-gray-500">{formatCostEstimate(interaction.cost_estimate)}</div>
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
