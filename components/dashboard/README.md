# Dashboard Components

This directory contains components used for the dashboard interface in Hey Bear.

## UsageDisplay

The `UsageDisplay` component is a flexible component for displaying usage metrics in various formats. It can display metrics inline or as cards and works with different data formats.

### Props

| Prop            | Type                     | Default   | Description                                        |
| --------------- | ------------------------ | --------- | -------------------------------------------------- |
| title           | string                   | -         | Title of the usage metric                          |
| usage           | UsageMetric or UsageData | undefined | Usage data to display                              |
| variant         | 'inline' or 'card'       | 'inline'  | Whether to show as inline element or in a card     |
| isLoading       | boolean                  | false     | Whether the component is in loading state          |
| dangerThreshold | number                   | 80        | Percentage at which to show warning/danger styling |
| description     | string                   | undefined | Optional description for card variant              |
| icon            | React.ReactNode          | undefined | Optional icon to display with the metric           |
| className       | string                   | ''        | Additional CSS classes                             |

### Usage Examples

#### Inline variant:

```tsx
<UsageDisplay title="Phone Numbers" usage={phoneNumbers} isLoading={loading} variant="inline" />
```

#### Card variant:

```tsx
<UsageDisplay
  title="Message Usage"
  usage={currentAssistant?.plan.messages}
  isLoading={loading}
  variant="card"
  description="Messages sent this billing cycle"
  icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
/>
```

#### With icon layout:

```tsx
<div className="flex items-center gap-3">
  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
    <Phone className="h-4 w-4 text-purple-600" />
  </div>
  <div className="flex-1">
    <UsageDisplay title="Phone Numbers" usage={phoneNumbers} isLoading={loading} variant="inline" />
  </div>
</div>
```

## PlanInfoHeader

The `PlanInfoHeader` component displays the current plan type with optional upgrade button.

### Props

| Prop        | Type                              | Default   | Description                          |
| ----------- | --------------------------------- | --------- | ------------------------------------ |
| planType    | string                            | -         | The name of the current plan         |
| isLoading   | boolean                           | -         | Whether the component is loading     |
| upgradePath | string                            | undefined | Optional path for upgrade link       |
| onUpgrade   | () => void                        | undefined | Optional callback for upgrade button |
| variant     | 'default' or 'compact' or 'badge' | 'default' | Display variant for the component    |

### Usage Example:

```tsx
<PlanInfoHeader planType={planType} isLoading={loading} upgradePath="/dashboard/billing" />
```

## AssistantSelector

The `AssistantSelector` component provides a dropdown for selecting an assistant.

### Props

| Prop              | Type                    | Description                                |
| ----------------- | ----------------------- | ------------------------------------------ |
| assistants        | Assistant[]             | Array of assistants to select from         |
| selectedAssistant | string                  | The ID of the currently selected assistant |
| onAssistantChange | (value: string) => void | Callback when selection changes            |
| isLoading         | boolean                 | Whether the component is loading           |

### Usage Example:

```tsx
<AssistantSelector
  assistants={assistants}
  selectedAssistant={selectedAssistant}
  onAssistantChange={setSelectedAssistant}
  isLoading={loading}
/>
```
