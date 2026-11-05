import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';

import { JobsService } from './jobs.service.js';

@Controller('api')
export class AppController {

  constructor(private readonly jobsService: JobsService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('jobs')
  async createJob(@Body('task') task: string) {

    if (!task || typeof task !== 'string' || !task.trim()) {
      throw new BadRequestException('Task is required');
    }

    return this.jobsService.createJob(task.trim());
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return this.jobsService.getJob(id);
  }
}