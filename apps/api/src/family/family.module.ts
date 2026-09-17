import { Module } from '@nestjs/common';
import { ConsentsModule } from '../consents/consents.module';
import { ParentsController, StudentsController } from './family.controller';
import { FamilyService } from './family.service';

@Module({ imports: [ConsentsModule], controllers: [StudentsController, ParentsController], providers: [FamilyService] })
export class FamilyModule {}
