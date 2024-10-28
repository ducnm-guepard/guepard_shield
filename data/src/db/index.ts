import pg from "pg";
import { logger } from "../libs/logger.js";

const client = new pg.Pool({
  user: "postgres",
  password: "1234",
  host: "localhost",
  port: 5432,
  database: "chinook",
});

await client.connect();

logger.info("Connect db success");

export const db = {
  execute(statement: string) {
    return client.query(statement);
  },
};
