/*
 * Design: "Ink & Paper" — Document-Inspired Minimalism
 * Upload zone styled as a dashed-border "paper" area.
 * Indigo border glow on drag-over. Clean, minimal interaction.
 */

import { Upload, X, Image as ImageIcon } from "lucide-react";

interface UploadZoneProps {
  preview: string | null;
  fileName: string | null;
  isDragOver: boolean;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClickUpload: () => void;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadZone({
  preview,
  fileName,
  isDragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onClickUpload,
  onClear,
  fileInputRef,
  onInputChange,
}: UploadZoneProps) {
  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={onInputChange}
        className="hidden"
      />

      {!preview ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={onClickUpload}
          className={`
            relative cursor-pointer rounded-lg border-2 border-dashed
            transition-all duration-200
            ${
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-foreground/25 hover:bg-muted/30"
            }
          `}
        >
          <div className="flex flex-col items-center justify-center py-14 px-6">
            <div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-4
                transition-colors duration-200
                ${isDragOver ? "bg-primary/10" : "bg-muted"}
              `}
            >
              <Upload
                size={20}
                className={`transition-colors duration-200 ${
                  isDragOver ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Drop your image here, or{" "}
              <span className="text-primary underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot, note, or whiteboard image.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, JPEG accepted
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden bg-card">
          <div className="relative">
            <img
              src={preview}
              alt="Uploaded preview"
              className="w-full max-h-80 object-contain bg-muted/20"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 border-t border-border bg-muted/30">
            <ImageIcon size={14} className="text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-foreground/70 truncate">
              {fileName}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
