"use client";

import { Button } from "@/components/ui/button";
import { type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { useTransition } from "react";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  className?: string;
  formAction?: (formData: FormData) => Promise<any>;
  variant?: string;
};

export function SubmitButton({
  children,
  className,
  formAction,
  variant = "default", // Set default variant if not provided
  pendingText = "Submitting...",
  ...props
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { pending } = useFormStatus();
  const isDisabled = pending || isPending;

  return (
    <Button
      className={className} // Apply className
      disabled={isDisabled}
      type="submit"
      variant={variant} // Use the variant prop
      onClick={() =>
        startTransition(() => {
          formAction && formAction(new FormData());
        })
      }
      {...props}
    >
      {isPending ? pendingText || "Processing..." : children}
    </Button>
  );
}
