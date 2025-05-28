import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FileUploader({
  onFilesSelected,
  accept = "*",
  multiple = false,
  disabled = false,
  className,
}) {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    if (!multiple && files.length > 1) {
      alert('Please upload only one file');
      return;
    }

    onFilesSelected(multiple ? files : [files[0]]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    onFilesSelected(multiple ? files : [files[0]]);
    // Reset the input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="space-y-2">
        <div className="flex justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-muted-foreground">
          {multiple ? "Upload files" : "Upload a file"}
          {accept !== "*" && ` (${accept})`}
        </p>
      </div>
    </div>
  );
}
