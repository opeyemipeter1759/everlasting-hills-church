import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { HeadcountReadService } from '../src/headcount/services/headcount-read.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const read = app.get(HeadcountReadService);
  for (const date of ['2026-08-16', '2026-08-23', '2026-08-26']) {
    try {
      const result = await read.getForDate(date);
      console.log(date, '->', JSON.stringify({ canRecord: result.canRecord, serverDate: (result as any).serverDate, service: result.service?.name ?? null, hasHeadcount: !!result.headcount }));
    } catch (err) {
      console.log(date, '-> THREW:', (err as Error).message);
      console.log((err as Error).stack?.split('\n').slice(0, 6).join('\n'));
    }
  }
  await app.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
