"use client";

import React from "react";

import { Bot, FileText, Loader2, Phone, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileStatusBadge } from "@/components/ui/file-status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FileWithStatus {
  id: string;
  name: string;
  created_at: string;
  status?: string;
  purpose?: string;
}

interface FilesInterfaceProps {
  fileList: { files: FileWithStatus[] };
  file: File | null;
  url: string;
  inputType: "file" | "url";
  isUrlValid: boolean;
  isUploading: boolean;
  uploadProgress: number;
  assignedPhoneNumber: string | null;
  deletingFileIds: string[];
  processingFileIds: string[];
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  onInputTypeChange: (type: "file" | "url") => void;
  onUrlChange: (url: string) => void;
  onAddContent: () => void;
  onDeleteFile: (fileId: string) => void;
  onSwitchToChat: () => void;
}

type AssistantFileStatus = "ready" | "processing" | "failed";

const getFileStatus = (
  file: FileWithStatus,
  deletingFileIds: string[],
  processingFileIds: string[],
): AssistantFileStatus => {
  if (file.status) {
    if (file.status.toLowerCase() === "ready") return "ready";
    if (file.status.toLowerCase() === "processing") return "processing";
    if (file.status.toLowerCase() === "failed") return "failed";
  }

  if (deletingFileIds.includes(file.id)) {
    return "processing";
  }
  if (processingFileIds.includes(file.id)) {
    return "processing";
  }

  return "ready";
};

const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

export function FilesInterface({
  fileList,
  file,
  url,
  inputType,
  isUrlValid,
  isUploading,
  uploadProgress,
  assignedPhoneNumber,
  deletingFileIds,
  processingFileIds,
  getRootProps,
  getInputProps,
  isDragActive,
  onInputTypeChange,
  onUrlChange,
  onAddContent,
  onDeleteFile,
  onSwitchToChat,
}: FilesInterfaceProps) {
  const handleUrlChange = (value: string) => {
    onUrlChange(value);
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border-muted shadow-lg">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Knowledge Files</CardTitle>
            <CardDescription className="text-xs">
              Add documents or URLs to teach your No-Show
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={inputType === "file" ? "default" : "outline"}
              className="flex-1"
              onClick={() => onInputTypeChange("file")}
            >
              <FileText className="h-4 w-4 mr-2" /> File Upload
            </Button>
            <Button
              variant={inputType === "url" ? "default" : "outline"}
              className="flex-1"
              onClick={() => onInputTypeChange("url")}
            >
              <LinkIcon className="h-4 w-4 mr-2" /> URL Import
            </Button>
          </div>

          {inputType === "file" ? (
            <div className="mb-6">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
                  isDragActive
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/20 hover:border-primary/50",
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {file ? file.name : "Drop file here or click to upload"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {file
                        ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                        : "PDF, TXT, DOCX, PPT and more"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <Label htmlFor="url-input" className="text-sm font-medium">
                Website URL
              </Label>
              <div className="mt-2">
                <Input
                  id="url-input"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className={cn(
                    "w-full",
                    !isUrlValid && "border-red-500 focus:border-red-500",
                  )}
                />
                {!isUrlValid && (
                  <p className="text-xs text-red-500 mt-1">
                    Please enter a valid URL (must start with http:// or
                    https://)
                  </p>
                )}
              </div>
            </div>
          )}

          {(file ?? (url && isUrlValid)) && (
            <>
              {isUploading && (
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Upload progress
                  </Label>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              <Button
                onClick={onAddContent}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {inputType === "file" ? "Uploading..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {inputType === "file" ? "Upload File" : "Add URL"}
                  </>
                )}
              </Button>
            </>
          )}

          <div className="mt-6">
            <Label className="text-sm font-medium">
              Files ({fileList.files.length})
            </Label>
            {fileList.files.length === 0 ? (
              <div className="border rounded-md p-8 text-center mt-2">
                <p className="text-muted-foreground">No files uploaded yet</p>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                {fileList.files.map((file) => {
                  const status = getFileStatus(
                    file,
                    deletingFileIds,
                    processingFileIds,
                  );
                  const isDeleting = deletingFileIds.includes(file.id);
                  const isProcessing = status === "processing" && !isDeleting;

                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-md border border-muted bg-card/50 shadow-sm"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div className="truncate">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.purpose} •{" "}
                            {new Date(file.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileStatusBadge status={status} />

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={isDeleting || isProcessing}
                                onClick={() => onDeleteFile(file.id)}
                                className="text-muted-foreground hover:text-destructive h-8 w-8"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isDeleting ? "Deleting..." : "Delete file"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between p-3 border-t bg-card/50">
        {assignedPhoneNumber && (
          <Badge variant="outline" className="gap-1">
            <Phone className="h-3 w-3" />
            SMS Enabled: {assignedPhoneNumber}
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={onSwitchToChat}>
          <Bot className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
      </CardFooter>
    </Card>
  );
}
