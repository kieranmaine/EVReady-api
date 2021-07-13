/* eslint-disable  @typescript-eslint/no-explicit-any */
import knex, { Knex } from "knex";
import { getSecret, SecretKeys } from "./secrets";
import { Journey, WeeklyJourneysSummary } from "./models/journey";
import { User } from "./models/user";
import { ElectricVehicle } from "./models/electricVehicle";

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
  const journeyToInsert = { ...journey };

  if (!journeyToInsert.startDate) {
    journeyToInsert.startDate = new Date();
  }

  return (await db())("journeys").insert(journeyToInsert).returning("id");
}

export async function getJourneys(userId: string): Promise<Journey[]> {
  return (await db())("journeys")
    .where({ userId })
    .orderBy("startDate", "desc");
}

export async function getWeeklyJourneySummary(
  userId: string
): Promise<WeeklyJourneysSummary[]> {
  const client = await db();
  const results = await client.raw(
    `
    SELECT 
      date_trunc('week', "startDate") AS "weekStartDate", 
      COUNT(*) as "journeysCount",
      SUM("distanceMeters") / 1609 AS "totalMiles"
    FROM journeys
    GROUP BY 1
    ORDER BY 1 DESC
    `,
    { userId }
  );

  return results.rows.map(
    (row: any) =>
      ({
        weekStartDate: row.weekStartDate,
        journeysCount: parseInt(row.journeysCount),
        totalMiles: parseInt(row.totalMiles),
      } as WeeklyJourneysSummary)
  );
}

export async function getUser(id: string): Promise<User> {
  return (await db())("users").where({ id }).first<User>();
}

export async function getEVs(
  userId: string,
  make?: string,
  model?: string
): Promise<any[]> {
  const client = await db();
  const results = await client.raw(
    `
    SELECT make, model, range, price, efficiency, 
      ROUND((CAST(COUNT(J."totalDistance") AS FLOAT) / (
        SELECT COUNT(DISTINCT date_trunc('day', "startDate")) as totalJourneyDays 
        FROM journeys
        where "userId" = :userId
      )) * 100) AS "singleChargeDaysPercentage"
    FROM evs E
    LEFT JOIN (
      select date_trunc('day', "startDate"), SUM("distanceMeters") / 1609 as "totalDistance"
      from journeys
      where "userId" = :userId
      group by date_trunc('day', "startDate")
    ) J ON E.range > J."totalDistance"
    ${make && model ? "WHERE E.make = :make AND E.model = :model" : ""}
    GROUP BY make, model, range, price, efficiency
    ORDER BY COUNT(J."totalDistance") DESC, price ASC
    `,
    {
      userId,
      make: make || "",
      model: model || "",
    }
  );

  return results.rows as ElectricVehicle[];
}

export async function getAwayCharges(
  userId: string,
  make: string,
  model: string
): Promise<{ totalAwayCharges: number; meanWeeklyCharges: number }> {
  const client = await db();
  const results = await client.raw(
    `
    SELECT (
      SELECT SUM("totalTripDistance" / E.range)
      FROM (
        SELECT
        (
          SELECT SUM("distanceMeters") / 1609
          FROM journeys AJ
          WHERE 
            AJ."startDate" <= JAH."startDate" 
            AND AJ."startDate" > JAH.prev 
            AND AJ."userId" = :userId
        ) AS "totalTripDistance"
        FROM (
          SELECT J.*, LAG(J."startDate", 1) OVER (ORDER BY J."startDate") prev
          FROM journeys J
          WHERE "finishedAtHome" = true AND J."userId" = :userId
          ORDER BY J."startDate"
        ) JAH
        ORDER BY JAH."startDate"
      ) "totalJourneyDistances",
      evs E
      WHERE "totalTripDistance" IS NOT NULL AND make = :make AND model = :model
      GROUP BY E.make, E.model
    ) as "totalAwayCharges",
    (
      SELECT ROUND(AVG("weeklyDistanceMiles" / E.range::float)::numeric, 2)
      FROM evs E, WeeklyDistance WD	
      WHERE make = :make AND model = :model AND "userId" = :userId
    ) as "meanWeeklyCharges"
    `,
    {
      userId,
      make: make || "",
      model: model || "",
    }
  );

  if (results.rows.length == 0) {
    return { totalAwayCharges: 0, meanWeeklyCharges: 0 };
  }

  const row = results.rows[0];

  return {
    totalAwayCharges: parseInt(row.totalAwayCharges),
    meanWeeklyCharges: parseFloat(row.meanWeeklyCharges),
  };
}
