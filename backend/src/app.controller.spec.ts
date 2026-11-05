
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { JobsService } from './jobs.service.js';

describe('AppController', () => {
  let appController: AppController;

  const jobsServiceMock = {
    createJob: vi.fn(),
    getJob: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: JobsService,
          useValue: jobsServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('GET /api/health', () => {
    it('should return backend health status', () => {
      const result = appController.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('backend');
      expect(result.timestamp).toBeDefined();
      expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    });
  });

  describe('POST /api/jobs', () => {
    it('should create a job with a trimmed task', async () => {
      const expected = {
        id: 'test-job-id',
        task: 'Test task',
        status: 'pending',
        message: 'Job successfully queued',
      };

      jobsServiceMock.createJob.mockResolvedValue(expected);

      const result = await appController.createJob('  Test task  ');

      expect(jobsServiceMock.createJob).toHaveBeenCalledWith('Test task');
      expect(result).toEqual(expected);
    });
    it('should reject an empty task', async () => {
      await expect(appController.createJob('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject a whitespace-only task', async () => {
      await expect(appController.createJob('   ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject a missing task', async () => {
      await expect(
        appController.createJob(undefined as unknown as string),
      ).rejects.toThrow(BadRequestException);
    });

  });

  describe('GET /api/jobs/:id', () => {
    it('should return the requested job', async () => {
      const expected = {
        id: 'test-job-id',
        task: 'Test task',
        status: 'completed',
        result: 'Successfully processed',
      };

      jobsServiceMock.getJob.mockResolvedValue(expected);

      const result = await appController.getJob('test-job-id');

      expect(jobsServiceMock.getJob).toHaveBeenCalledWith('test-job-id');
      expect(result).toEqual(expected);
    });
  });
});
