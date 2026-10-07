import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'node:path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnvironment } from './config/environment';
import { DatabaseModule } from './database/database.module';
import { AuthGuard } from './http/guards/auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { AuthRoutesModule } from './routes/auth/auth-routes.module';
import { HealthRoutesModule } from './routes/health/health-routes.module';
import { OrganisationRoutesModule } from './routes/organisation/organisation-routes.module';
import { UsersRoutesModule } from './routes/users/users-routes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      skipProcessEnv: true,
      envFilePath: resolve(__dirname, '../.env'),
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    AuthRoutesModule,
    UsersRoutesModule,
    OrganisationRoutesModule,
    HealthRoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
