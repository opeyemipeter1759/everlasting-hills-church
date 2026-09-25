import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiClient } from './gemini-client';

@Module({
  controllers: [AiController],
  providers: [AiService, GeminiClient],
  exports: [GeminiClient],
})
export class AiModule {}
