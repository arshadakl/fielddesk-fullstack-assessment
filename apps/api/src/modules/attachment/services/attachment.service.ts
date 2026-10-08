import type { Readable } from 'node:stream';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { TenantContext } from '../../../common/interfaces/tenant-context.interface';
import {
  STORAGE_DRIVER,
  type StorageDriverPort,
} from '../../../infrastructure/storage/storage-driver.port';
import { WORK_ORDER_REPOSITORY } from '../../work-order/interfaces/work-order-repository.interface';
import type { WorkOrderRepositoryPort } from '../../work-order/interfaces/work-order-repository.interface';
import {
  ATTACHMENT_REPOSITORY,
  type AttachmentRepositoryPort,
  type AttachmentSummary,
  type StorageQuotaUsage,
} from '../interfaces/attachment.interface';
import { validateUploadedFile } from '../utils/file-validator';

export interface UploadAttachmentInput {
  workOrderId: string;
  uploaderId: string;
  userRole: string;
  file: Express.Multer.File;
}

export interface StreamAttachmentResult {
  stream: Readable;
  mimeType: string;
  byteSize: number;
  originalFileName: string;
}

@Injectable()
export class AttachmentService {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly repository: AttachmentRepositoryPort,
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrderRepository: WorkOrderRepositoryPort,
    @Inject(STORAGE_DRIVER)
    private readonly storageDriver: StorageDriverPort,
  ) {}

  private async assertWorkOrderAccess(
    organisationId: string,
    workOrderId: string,
    userRole: string,
    userId: string,
  ): Promise<void> {
    const workOrder = await this.workOrderRepository.findById(
      organisationId,
      workOrderId,
    );

    if (!workOrder) {
      throw new NotFoundException('Resource not found');
    }

    if (
      userRole === 'TECHNICIAN' &&
      workOrder.assignedTechnicianId !== userId
    ) {
      throw new NotFoundException('Resource not found');
    }
  }

  async upload(
    context: TenantContext,
    input: UploadAttachmentInput,
  ): Promise<AttachmentSummary> {
    // 1. Verify work order exists and caller has access
    await this.assertWorkOrderAccess(
      context.organisationId,
      input.workOrderId,
      input.userRole,
      input.uploaderId,
    );

    // 2. Validate file via magic byte sniffing & size limits
    const { validatedMimeType, byteSize, originalFileName } =
      validateUploadedFile(input.file);

    // 3. Storage quota check
    const quota = await this.repository.getOrganisationStorageUsage(
      context.organisationId,
    );

    if (!quota) {
      throw new NotFoundException('Resource not found');
    }

    const projectedUsed = quota.usedBytes + BigInt(byteSize);
    if (projectedUsed > quota.quotaBytes) {
      throw new HttpException(
        'Organisation storage quota exceeded. Upgrade storage or delete old attachments.',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }

    // 4. Save file to storage driver (opaque UUID storage key)
    const { storageKey } = await this.storageDriver.save(
      input.file.buffer,
      originalFileName,
    );

    // 5. Persist attachment record in database; cleanup disk if DB fails
    try {
      const record = await this.repository.create({
        organisationId: context.organisationId,
        workOrderId: input.workOrderId,
        uploaderId: input.uploaderId,
        storageKey,
        originalFileName,
        mimeType: validatedMimeType,
        byteSize,
      });

      return record;
    } catch (err: unknown) {
      await this.storageDriver.delete(storageKey);
      throw err;
    }
  }

  async list(
    context: TenantContext,
    workOrderId: string,
    userRole: string,
    userId: string,
  ): Promise<AttachmentSummary[]> {
    await this.assertWorkOrderAccess(
      context.organisationId,
      workOrderId,
      userRole,
      userId,
    );

    return this.repository.listByWorkOrder(context.organisationId, workOrderId);
  }

  async getStream(
    context: TenantContext,
    workOrderId: string,
    attachmentId: string,
    userRole: string,
    userId: string,
  ): Promise<StreamAttachmentResult> {
    await this.assertWorkOrderAccess(
      context.organisationId,
      workOrderId,
      userRole,
      userId,
    );

    const attachment = await this.repository.findById(
      context.organisationId,
      workOrderId,
      attachmentId,
    );

    if (!attachment) {
      throw new NotFoundException('Resource not found');
    }

    const stream = await this.storageDriver.getStream(attachment.storageKey);

    return {
      stream,
      mimeType: attachment.mimeType,
      byteSize: attachment.byteSize,
      originalFileName: attachment.originalFileName,
    };
  }

  async delete(
    context: TenantContext,
    workOrderId: string,
    attachmentId: string,
    userRole: string,
    userId: string,
  ): Promise<void> {
    await this.assertWorkOrderAccess(
      context.organisationId,
      workOrderId,
      userRole,
      userId,
    );

    const attachment = await this.repository.findById(
      context.organisationId,
      workOrderId,
      attachmentId,
    );

    if (!attachment) {
      throw new NotFoundException('Resource not found');
    }

    // Only OWNER or uploader can delete attachment
    if (userRole !== 'OWNER' && attachment.uploaderId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this attachment',
      );
    }

    const deleted = await this.repository.delete(
      context.organisationId,
      workOrderId,
      attachmentId,
    );

    if (deleted) {
      await this.storageDriver.delete(deleted.storageKey);
    }
  }

  async getStorageUsage(context: TenantContext): Promise<StorageQuotaUsage> {
    const quota = await this.repository.getOrganisationStorageUsage(
      context.organisationId,
    );

    if (!quota) {
      throw new NotFoundException('Resource not found');
    }

    return quota;
  }
}
