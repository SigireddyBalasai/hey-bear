// Utility functions and helpers for admin users UI
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import * as React from 'react';
import type { ReactNode } from 'react';


export const getInitials = (name = ''): string =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const getStatusBadgeVariant = (status: string): string => {
  if (status === 'active') return 'default';
  if (status === 'inactive') return 'secondary';

  return 'outline';
};

export const getStatusBadgeContent = (status: string): ReactNode => {
  if (status === 'active') {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(CheckCircle, { className: 'mr-1 h-3 w-3' }),
      ' Active'
    );
  }
  if (status === 'inactive') {
    return React.createElement(
      React.Fragment,
      null,
      React.createElement(XCircle, { className: 'mr-1 h-3 w-3' }),
      ' Inactive'
    );
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(AlertCircle, { className: 'mr-1 h-3 w-3' }),
    ' Pending'
  );
};
