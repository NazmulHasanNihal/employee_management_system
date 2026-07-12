import { Queue, Worker, QueueEvents } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Use UPSTASH_REDIS_REST_URL or local redis fallback
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const connectionCast = connection as unknown as ConnectionOptions;

export const payrollQueue = new Queue('payrollQueue', { connection: connectionCast });

const payrollWorker = new Worker(
  'payrollQueue',
  async (job) => {
    if (job.name === 'batchPayroll') {
      console.log('Processing batch payroll job...');
      // Logic for processing payrolls, integrating with Go Microservice for PDFs
      // Mocking work
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('Batch payroll job finished.', job.data);
      return { success: true, processed: job.data.employeesCount };
    }
  },
  { connection: connectionCast }
);

export const payrollEvents = new QueueEvents('payrollQueue', { connection: connectionCast });

payrollWorker.on('completed', (job) => {
  console.log(`${job.id} has completed!`);
});

payrollWorker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
