import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  get() {
    return { ok: true, uptime: process.uptime() };
  }
}
