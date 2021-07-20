import { Knex } from "knex";
import pg from "pg";
import { db } from "../../src/repository";

// Required for knex to return decimal data types as numeric values
// instead of strings
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value: string) => {
  return parseFloat(value);
});

export const userId = "e64b7281-18ab-4d27-b788-b38300e950e1";

export let client: Knex;

beforeAll(async () => {
  client = await db();
});

afterAll(async () => {
  await client.destroy();
});
