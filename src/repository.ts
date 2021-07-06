/* eslint-disable  @typescript-eslint/no-explicit-any */

import knex, { Knex } from "knex";
import { getSecret, SecretKeys } from "./secrets";
import { Journey } from "./models/journey";

const createUnixSocketPool = async () => {
  const dbHost = process.env.DB_HOST;
  const dbSocketPath = process.env.DB_SOCKET_PATH || "/cloudsql";
  const dbPassword = process.env.DB_PASSWORD;

  // Establish a connection to the database
  return knex({
    client: "pg",
    connection: {
      user: process.env.DB_USER, // e.g. 'my-user'
      password: dbPassword || (await getSecret(SecretKeys.POSTGRES_PASSWORD)), // e.g. 'my-user-password'
      database: process.env.DB_NAME, // e.g. 'my-database'
      host:
        dbHost || `${dbSocketPath}/${process.env.CLOUD_SQL_CONNECTION_NAME}`,
      port: parseInt(process.env.DB_PORT || ""),
    },
  });
};

let connection: Knex<any, unknown[]> | null = null;

export const db = async (): Promise<Knex<any, unknown[]>> => {
  if (connection == null) {
    connection = await createUnixSocketPool();
  }
  return connection as Knex<any, unknown[]>;
};

export async function insertJourney(journey: Journey): Promise<number[]> {
  const journeyToInsert = {
    ...journey,
    startDate: new Date(),
  } as Journey;

  return (await db())("journeys").insert(journeyToInsert).returning("id");
}

export async function getEVs(): Promise<any[]> {
  return (await db())("evs");
}
