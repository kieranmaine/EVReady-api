import { db } from "../../src/repository";
import { userId } from "./setup";

export const databaseCleanup = async (): Promise<void> => {
  // Clean up database before each test
  const con = await db();

  await con.raw(`  
    DELETE FROM journeys;
    ALTER SEQUENCE journeys_id_seq RESTART;
    UPDATE journeys SET id = DEFAULT;

    DELETE FROM "fuelPurchases";

    DELETE FROM users WHERE id != '${userId}'; 
  `);
};
