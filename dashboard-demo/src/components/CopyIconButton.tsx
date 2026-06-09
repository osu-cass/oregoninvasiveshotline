import { Button } from "@cloudflare/kumo/components/button";
import { Check, Clipboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CopyIconButtonProps {
  /** Label announced before the copy action succeeds. */
  ariaLabel: string;
  /** Label announced while the copied state is visible. */
  copiedLabel: string;
  /** Text copied to the clipboard. */
  text: string;
}

/** Renders an icon-only copy button with animated success feedback. */
export function CopyIconButton({
  ariaLabel,
  copiedLabel,
  text,
}: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyText = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 1200);
  };

  return (
    <Button
      aria-label={copied ? copiedLabel : ariaLabel}
      className="overflow-hidden"
      size="sm"
      shape="square"
      variant="ghost"
      onClick={() => void copyText()}
    >
      <span className="relative inline-grid size-4 place-items-center">
        <Clipboard
          aria-hidden="true"
          className={`absolute transition-[filter,opacity,transform] duration-150 ${
            copied ? "scale-[0.68] opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-0"
          }`}
          size={15}
        />
        <Check
          aria-hidden="true"
          className={`absolute text-emerald-700 transition-[filter,opacity,transform] duration-150 ${
            copied ? "scale-100 opacity-100 blur-0" : "scale-[0.72] opacity-0 blur-[3px]"
          }`}
          size={15}
        />
      </span>
    </Button>
  );
}
