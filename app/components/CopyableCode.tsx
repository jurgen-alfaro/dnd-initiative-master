"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableCodeProps {
  code: string;
}

export default function CopyableCode({ code }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="dnd-rune-text text-lg font-heading font-semibold inline-flex items-center gap-2 cursor-pointer hover:text-dnd-gold transition-colors"
    >
      {code}
      {copied ? (
        <Check size={16} className="text-green-400" />
      ) : (
        <Copy size={16} className="text-muted-foreground" />
      )}
    </button>
  );
}
