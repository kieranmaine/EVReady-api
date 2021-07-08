import { db } from "../../src/repository";

export const userId = "e64b7281-18ab-4d27-b788-b38300e950e1";

afterAll(async () => {
  await (await db()).destroy();
});
