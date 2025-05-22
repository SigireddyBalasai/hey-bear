export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  const messageType =
    "success" in message
      ? "success"
      : "error" in message
      ? "error"
      : "message";

  const content = message[messageType as keyof Message];
  const isError = messageType === "error";

  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      <div
        className={`${
          isError
            ? "text-destructive-foreground border-destructive-foreground"
            : "text-foreground border-foreground"
        } border-l-2 px-4`}
      >
        {content}
      </div>
    </div>
  );
}
