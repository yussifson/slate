import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, X, FileText } from "lucide-react";

export default function DocumentPreviewModal({ fileUrl, fileName, open, onClose }) {
  if (!fileUrl) return null;

  // Determine file type based on extension
  const extension = fileName?.split(".").pop()?.toLowerCase() || "";
  const isImage = ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(extension);
  const isPdf = extension === "pdf";
  const isText = ["txt", "log", "json", "md"].includes(extension);

  let previewElement = null;

  if (isImage) {
    previewElement = (
      <div className="flex items-center justify-center p-4 bg-muted/20 rounded-lg max-h-[60vh] overflow-hidden">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full max-h-[50vh] object-contain rounded-md shadow-md animate-in fade-in duration-300"
        />
      </div>
    );
  } else if (isPdf) {
    previewElement = (
      <iframe
        src={`${fileUrl}#toolbar=0`}
        title={fileName}
        className="w-full h-[60vh] border border-border rounded-lg shadow-sm"
      />
    );
  } else if (isText) {
    // We can fetch or simply render via iframe as well, but iframe is easiest and safest
    previewElement = (
      <iframe
        src={fileUrl}
        title={fileName}
        className="w-full h-[60vh] border border-border rounded-lg bg-card p-4 text-sm font-mono shadow-sm"
      />
    );
  } else {
    // Use Google Docs Viewer for docx, xlsx, pptx etc.
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    previewElement = (
      <iframe
        src={googleViewerUrl}
        title={fileName}
        className="w-full h-[60vh] border border-border rounded-lg shadow-sm"
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-6 font-sans">
        <DialogHeader className="border-b border-border pb-3 flex flex-row items-center justify-between gap-4">
          <div>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {fileName}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 select-none pr-8">
            <a href={fileUrl} download={fileName} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
            </a>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ExternalLink className="w-3.5 h-3.5" /> Open Direct
              </Button>
            </a>
          </div>
        </DialogHeader>
        <div className="mt-4">
          {previewElement}
        </div>
      </DialogContent>
    </Dialog>
  );
}
