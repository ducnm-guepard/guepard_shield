import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from './db/index.js';
import { UniqueLineAppender } from './unique-appender.js';
import { serve } from '@hono/node-server';

const app = new Hono();
app.use(honoLogger());

const appender = new UniqueLineAppender('query/union-based.txt', 1);

app.get(
  '/union',
  zValidator(
    'query',
    z.object({
      q: z.string(),
    })
  ),
  async (c) => {
    try {
      const { q } = c.req.valid('query');

      const query = `select * from track t join genre r on t.genre_id = g.genre_id where g.name = '${q}'`;

      await appender.appendLine(query);

      const result = await db.execute(query);
      return c.json({ films: result.rows });
    } catch (error) {
      return c.text((error as Error).message);
    }
  }
);

const port = 8000;
console.log(`Server is running on: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
})