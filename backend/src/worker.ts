import 'dotenv/config';

import { Worker, Job } from 'bullmq';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || 6379),
};

async function processJob(job: Job) {

  const { jobId, task } = job.data;

  console.log(`Processing job: ${jobId}`);

  await pool.query(
    `UPDATE jobs
     SET status = 'processing',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [jobId],
  );

  try {

    // Simulate a background operation.
    await new Promise(resolve => setTimeout(resolve, 3000));

    const result = `Successfully processed: ${task.toUpperCase()}`;

    await pool.query(
      `UPDATE jobs
       SET status = 'completed',
           result = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [jobId, result],
    );

    console.log(`Completed job: ${jobId}`);

    return { result };

  } catch (error) {

    await pool.query(
      `UPDATE jobs
       SET status = 'failed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [jobId],
    );

    throw error;
  }
}

const worker = new Worker(
  'jobs',
  processJob,
  {
    connection,
    concurrency: 5,
  },
);

worker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

worker.on('error', error => {
  console.error('Worker error:', error);
});

console.log('Background worker started. Waiting for jobs...');

async function shutdown() {
  console.log('Shutting down worker...');

  await worker.close();
  await pool.end();

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);