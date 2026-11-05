import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
} from '@nestjs/common';

import { Pool } from 'pg';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {

  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  private readonly queue = new Queue('jobs', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
    },
  });

  async onModuleInit() {

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        task TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('PostgreSQL connected. Jobs table ready.');
  }

  async createJob(task: string) {

    const id = randomUUID();

    await this.pool.query(
      `INSERT INTO jobs (id, task, status)
       VALUES ($1, $2, 'pending')`,
      [id, task],
    );

    try {

      await this.queue.add(
        'process-task',
        { jobId: id, task },
        {
          jobId: id,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );

    } catch (error) {

      await this.pool.query(
        `UPDATE jobs
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id],
      );

      throw error;
    }

    return {
      id,
      task,
      status: 'pending',
      message: 'Job successfully queued',
    };
  }

  async getJob(id: string) {

    const { rows } = await this.pool.query(
      'SELECT * FROM jobs WHERE id = $1',
      [id],
    );

    if (!rows.length) {
      throw new NotFoundException('Job not found');
    }

    return rows[0];
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.pool.end();
  }
}