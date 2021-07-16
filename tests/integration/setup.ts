import { Knex } from "knex";
import { db } from "../../src/repository";

export const userId = "e64b7281-18ab-4d27-b788-b38300e950e1";

export let client: Knex;

beforeAll(async () => {
  client = await db();
});

afterAll(async () => {
  await client.destroy();
});
