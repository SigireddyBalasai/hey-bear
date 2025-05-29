export type Message = { success: string } | { error: string } | { message: string };

export function FormMessage({ message }: Readonly<{ message: Message }>) {
  const messageType = 'success' in message ? 'success' : 'error' in message ? 'error' : 'message';

  const content = message[messageType as keyof Message];
  const isError = messageType === 'error';

  const borderClass = isError
    ? 'border-destructive-foreground text-destructive-foreground'
    : 'border-foreground text-foreground';

  return (
    <div className="flex w-full max-w-md flex-col gap-2 text-sm">
      <div className={`${borderClass} border-l-2 px-4`}>{content}</div>
    </div>
  );
}
