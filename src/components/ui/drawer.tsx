import type { ReactNode } from "react";
import { Drawer as Vaul } from "vaul";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Vaul.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      {children}
    </Vaul.Root>
  );
}

export function DrawerTrigger({
  children,
  ...props
}: React.ComponentProps<typeof Vaul.Trigger>) {
  return <Vaul.Trigger {...props}>{children}</Vaul.Trigger>;
}

export function DrawerContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Vaul.Portal>
      <Vaul.Overlay className="fixed inset-x-0 bottom-0 top-0 z-50 bg-fg/40" />
      <Vaul.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-xl bg-surface outline-none",
          className,
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" />
        {children}
      </Vaul.Content>
    </Vaul.Portal>
  );
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Vaul.Title>) {
  return (
    <Vaul.Title
      className={cn("font-display text-lg font-medium tracking-tight", className)}
      {...props}
    />
  );
}
