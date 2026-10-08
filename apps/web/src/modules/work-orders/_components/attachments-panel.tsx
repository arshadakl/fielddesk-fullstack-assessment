'use client';

import * as React from 'react';
import {
  AlertCircle,
  Download,
  FileIcon,
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/env';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeleteAttachment,
  useStorageUsage,
  useUploadAttachment,
  useWorkOrderAttachments,
} from '../_hooks/use-work-orders';
import type { AttachmentResDto } from '../_api/api.types';

interface AttachmentsPanelProps {
  workOrderId: string;
  isTechnician: boolean;
  isAssignedToMe: boolean;
  currentUserId?: string;
  isOwner?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <ImageIcon className="size-4 text-sky-500 shrink-0" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="size-4 text-rose-500 shrink-0" />;
  }
  return <FileIcon className="size-4 text-muted-foreground shrink-0" />;
}

export function AttachmentsPanel({
  workOrderId,
  isTechnician,
  isAssignedToMe,
  currentUserId,
  isOwner,
}: AttachmentsPanelProps) {
  const { data: attachments, isLoading } = useWorkOrderAttachments(workOrderId);
  const { data: storageUsage } = useStorageUsage();
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = React.useState<AttachmentResDto | null>(null);

  const canUpload = !isTechnician || isAssignedToMe;

  const handleFileUpload = async (file: File) => {
    // Client-side quick check (check MIME type and filename extension fallback)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ext && ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext);

    if (file.type ? !allowedTypes.includes(file.type) : !isAllowedExt) {
      toast.error('Only JPEG, PNG, WebP, and PDF files are permitted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10 MB.');
      return;
    }

    if (storageUsage && storageUsage.remainingBytes < file.size) {
      toast.error('Storage quota exceeded. Please upgrade or delete old files.');
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        workOrderId,
        file,
      });
      toast.success(`Uploaded ${file.name}`);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Failed to upload attachment';
      toast.error(msg);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
    // Reset file input so identical file can be selected again
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canUpload) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  };

  const confirmDelete = async () => {
    if (!attachmentToDelete) return;
    try {
      await deleteMutation.mutateAsync({
        workOrderId,
        attachmentId: attachmentToDelete.id,
      });
      toast.success('Attachment deleted');
      setAttachmentToDelete(null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
          ? err.message
          : 'Failed to delete attachment';
      toast.error(msg);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Attachments & Photos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Documents, equipment manuals, and completion photos (PDF, JPEG, PNG, WebP up to 10 MB).
          </p>
        </div>

        {storageUsage && (
          <div className="text-right">
            <span className="text-xs font-medium text-foreground">
              Storage: {storageUsage.percentageUsed}%
            </span>
            <div className="text-[11px] text-muted-foreground">
              {formatBytes(storageUsage.usedBytes)} of {formatBytes(storageUsage.quotaBytes)}
            </div>
          </div>
        )}
      </div>

      {storageUsage && storageUsage.percentageUsed >= 85 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Storage quota warning: Organisation has consumed {storageUsage.percentageUsed}% of its storage quota.
          </span>
        </div>
      )}

      {/* Upload Dropzone */}
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border/80 hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={onFileChange}
            className="hidden"
          />
          {uploadMutation.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin text-primary" />
              <span>Verifying and uploading file...</span>
            </div>
          ) : (
            <>
              <UploadCloud className="size-6 text-muted-foreground" />
              <div className="text-xs">
                <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
              </div>
              <p className="text-[11px] text-muted-foreground">
                Max 10 MB per file. Magic-byte verified.
              </p>
            </>
          )}
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-2 pt-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ) : !attachments || attachments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No attachments or photos uploaded yet.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {attachments.map((att) => {
              const canDelete = isOwner || att.uploaderId === currentUserId;
              const downloadUrl = `${getApiUrl()}/api/v1/work-orders/${workOrderId}/attachments/${att.id}`;

              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 p-3 text-sm hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(att.mimeType)}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground text-xs">
                        {att.originalFileName}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span>{formatBytes(att.byteSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {att.uploaderName}</span>
                        <span>•</span>
                        <span>{new Date(att.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      asChild
                      title="Download file"
                    >
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer" download>
                        <Download className="size-4" />
                        <span className="sr-only">Download</span>
                      </a>
                    </Button>

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setAttachmentToDelete(att)}
                        disabled={deleteMutation.isPending}
                        title="Delete attachment"
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deletion */}
      <Dialog
        open={Boolean(attachmentToDelete)}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null);
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete Attachment</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete &quot;{attachmentToDelete?.originalFileName}&quot;?
            This will remove the file from storage and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAttachmentToDelete(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </Dialog>
    </section>
  );
}
