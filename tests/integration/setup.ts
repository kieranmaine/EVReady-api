import { db } from "../../src/repository";

beforeAll(async () => {
  // Clean up database before each test
  await (
    await db()
  ).raw(`  
    DELETE FROM journeys;
    ALTER SEQUENCE journeys_id_seq RESTART;
    UPDATE journeys SET id = DEFAULT;
  `);
});

afterAll(async () => {
  await (await db()).destroy();
});
