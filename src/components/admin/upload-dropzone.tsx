"use client";

import { useRef } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QueuedUpload = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "uploaded" | "error";
  error?: string;
  storageKey?: string;
};

type UploadDropzoneProps = {
  uploads: QueuedUpload[];
  disabled?: boolean;
  onFilesAdded: (files: File[]) => void;
  onRemove: (id: string) => void;
};

export function UploadDropzone({ uploads, disabled, onFilesAdded, onRemove }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFileList(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    onFilesAdded(Array.from(fileList).filter((file) => file.type.startsWith("image/")));
  }

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (disabled) {
            return;
          }
          handleFileList(event.dataTransfer.files);
        }}
        className={`block w-full rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-8 text-left text-sm text-stone-300 transition hover:border-white/25 hover:bg-black/30 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <div className="flex items-center gap-3 text-stone-100">
          <UploadCloud className="h-5 w-5 text-brand-accent" />
          <span className="font-medium">Upload originals to R2</span>
        </div>
        <p className="mt-3 max-w-2xl leading-7 text-stone-300">
          Drag image files here or browse from disk. Each upload is signed server-side and written directly into the collection folder inside Cloudflare R2.
        </p>
        <div className="mt-5">
          <Button type="button" variant="ghost">Choose image files</Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFileList(event.target.files)}
      />

      {uploads.length > 0 && (
        <div className="grid gap-3">
          {uploads.map((upload) => (
            <div key={upload.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-200">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium text-stone-100">
                  <ImagePlus className="h-4 w-4 text-brand-accent" />
                  <span className="truncate">{upload.file.name}</span>
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                  {Math.round(upload.file.size / 1024)} KB · {upload.status}
                  {upload.error ? ` · ${upload.error}` : ""}
                </div>
                {upload.storageKey && <div className="mt-1 truncate text-xs text-stone-500">{upload.storageKey}</div>}
              </div>
              <button type="button" onClick={() => onRemove(upload.id)} className="rounded-full border border-white/10 p-2 text-stone-300 hover:bg-white/5" disabled={disabled || upload.status === "uploading"}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
