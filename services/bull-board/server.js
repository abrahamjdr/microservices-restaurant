const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { Queue } = require('bullmq');
const express = require('express');

const REDIS_HOST = process.env.REDIS_HOST ?? 'redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6379', 10);
const PORT = parseInt(process.env.PORT ?? '3001', 10);

const connection = { host: REDIS_HOST, port: REDIS_PORT };

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/');

createBullBoard({
  queues: [
    new BullMQAdapter(new Queue('plate-reserve', { connection })),
    new BullMQAdapter(new Queue('plate-result', { connection })),
  ],
  serverAdapter,
});

const app = express();
app.use('/', serverAdapter.getRouter());
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bull Board running at http://0.0.0.0:${PORT}`);
});
