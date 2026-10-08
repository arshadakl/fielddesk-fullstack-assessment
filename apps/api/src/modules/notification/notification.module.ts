import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { MockNotificationProvider } from './providers/mock-notification.provider';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    NotificationService,
    {
      provide: 'NotificationRepositoryPort',
      useClass: NotificationRepository,
    },
    {
      provide: 'NotificationProviderPort',
      useClass: MockNotificationProvider,
    },
  ],
  exports: [NotificationService, 'NotificationRepositoryPort'],
})
export class NotificationModule {}
