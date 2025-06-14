// This file contains general application types that don't fit into specific categories.
// Most interfaces have been moved to more specific type files for better organization.

// Re-export commonly used types from specific type files
export type { AuthContext, AuthResult } from './auth.types';
export type { AssistantData, AssistantWithRelations } from './assistant.types';
export type { PlanLimits, TransformedInteraction } from './interaction.types';
export type { StatCardProps } from './dashboard.types';
