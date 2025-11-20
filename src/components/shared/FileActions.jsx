import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, CheckCircle2 } from "lucide-react";

export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState("");

  const copy = (content, id = "default") => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  };

  return { copied, copy };
};

export const CopyButton = ({ content, id, size = "sm" }) => {
  const { copied, copy } = useCopyToClipboard();
  
  return (
    <Button
      onClick={() => copy(content, id)}
      size={size}
      variant="ghost"
    >
      {copied === id ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );
};

export const downloadFile = (fileName, content) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const DownloadButton = ({ fileName, content, size = "sm" }) => {
  return (
    <Button
      onClick={() => downloadFile(fileName, content)}
      size={size}
      variant="ghost"
    >
      <Download className="w-4 h-4" />
    </Button>
  );
};