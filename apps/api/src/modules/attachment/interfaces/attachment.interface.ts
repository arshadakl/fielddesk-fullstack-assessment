export interface AttachmentSummary {
  id: string;
  organisationId: string;
  workOrderId: string;
  uploaderId: string;
  uploaderName: string;
  originalFileName: string;
  mimeType: string;
  byteSize: number;
  createdAt: Date;
}

export interface AttachmentStorageDetails extends AttachmentSummary {
  storageKey: string;
}

export interface CreateAttachmentRecordInput {
  organisationId: string;
  workOrderId: string;
  uploaderId: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  byteSize: number;
}

export interface StorageQuotaUsage {
  usedBytes: bigint;
  quotaBytes: bigint;
}

export interface AttachmentRepositoryPort {
  create(input: CreateAttachmentRecordInput): Promise<AttachmentSummary>;
  findById(
    organisationId: string,
    workOrderId: string,
    attachmentId: string,
  ): Promise<AttachmentStorageDetails | null>;
  listByWorkOrder(
    organisationId: string,
    workOrderId: string,
  ): Promise<AttachmentSummary[]>;
  getOrganisationStorageUsage(organisationId: string): Promise<StorageQuotaUsage | null>;
  delete(
    organisationId: string,
    workOrderId: string,
    attachmentId: string,
  ): Promise<AttachmentStorageDetails | null>;
}

export const ATTACHMENT_REPOSITORY = Symbol('ATTACHMENT_REPOSITORY');
