import { Module } from '@nestjs/common';
import { ConsentsModule } from '../consents/consents.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({ imports: [ConsentsModule], controllers: [UsersController], providers: [UsersService] })
export class UsersModule {}
