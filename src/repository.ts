/* eslint-disable  @typescript-eslint/no-explicit-any */
import knex, { Knex } from "knex";
import { getSecret, SecretKeys } from "./secrets";
import { Journey, WeeklyJourneysSummary } from "./models/journey";
import { User } from "./models/user";
import { ElectricVehicle } from "./models/electricVehicle";
import { FuelPurchase } from "./models/fuelPurchase";

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

export async function updateUser(user: User): Promise<void> {
  const client = await db();
  await client("users").where({ id: user.id }).update(user);
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

export async function getEVStats(
  userId: string,
  make: string,
  model: string
): Promise<{
  totalAwayCharges: number;
  meanWeeklyCharges: number;
  chargingCostsMin: number;
  chargingCostsMax: number;
}> {
  const client = await db();
  const results = await client.raw(
    `
    WITH total_distance AS (
      SELECT SUM("distanceMeters") / 1609 AS distance_miles
      FROM journeys
      WHERE "userId" = :userId
    ), tariff_rates AS (
      SELECT 
        CASE "tariffType"
          WHEN 'singleRate' THEN "tariffRatePeak"
          WHEN 'economy7' THEN "tariffRateOffPeak"
        END AS min_rate,
        "tariffRatePeak" AS max_rate
      FROM users
      WHERE id = :userId
    )    
    SELECT
      ROUND(AVG("weeklyDistanceMiles" / E.range::float)::numeric, 2) AS "meanWeeklyCharges",
      ROUND(
        ((((distance_miles * efficiency) / 1000.0) * min_rate) / 100.0)::numeric
      ,2) AS "chargingCostsMin",
      ROUND(
        ((((distance_miles * efficiency) / 1000.0) * max_rate) / 100.0)::numeric
      , 2) AS "chargingCostsMax",
	    (
        SELECT SUM(total_trip_distance / E.range)
        FROM (
          SELECT
          (
            SELECT SUM("distanceMeters") / 1609
            FROM journeys AJ
            WHERE 
              AJ."startDate" <= JAH."startDate" 
              AND AJ."startDate" > JAH.prev 
              AND AJ."userId" = :userId
          ) AS total_trip_distance
          FROM (
            SELECT J.*, LAG(J."startDate", 1) OVER (ORDER BY J."startDate") prev
            FROM journeys J
            WHERE "finishedAtHome" = true AND J."userId" = :userId
            ORDER BY J."startDate"
          ) JAH
          ORDER BY JAH."startDate"
        ) "totalJourneyDistances",
        evs E
        WHERE total_trip_distance IS NOT NULL AND make = :make AND model = :model
        GROUP BY E.make, E.model
      ) as "totalAwayCharges"
    FROM evs E, total_distance, tariff_rates, WeeklyDistance WD
    WHERE E.make = :make AND E.model = :model AND WD."userId" = :userId
	  GROUP BY distance_miles, efficiency, min_rate, max_rate;
    `,
    {
      userId,
      make: make || "",
      model: model || "",
    }
  );

  if (results.rows.length == 0) {
    return {
      totalAwayCharges: 0,
      meanWeeklyCharges: 0,
      chargingCostsMin: 0,
      chargingCostsMax: 0,
    };
  }

  const row = results.rows[0];

  return {
    totalAwayCharges: parseInt(row.totalAwayCharges),
    meanWeeklyCharges: parseFloat(row.meanWeeklyCharges),
    chargingCostsMin: parseFloat(row.chargingCostsMin),
    chargingCostsMax: parseFloat(row.chargingCostsMax),
  };
}

export async function insertFuelPurchase(
  fuelPurchase: FuelPurchase
): Promise<FuelPurchase> {
  const fuelPurchaseToInsert = { ...fuelPurchase };

  if (!fuelPurchaseToInsert.purchaseDate) {
    fuelPurchaseToInsert.purchaseDate = new Date();
  }

  await (await db())("fuelPurchases").insert(fuelPurchaseToInsert);

  return fuelPurchaseToInsert;
}

export async function getFuelPurchases(
  userId: string
): Promise<FuelPurchase[]> {
  return await (await db())<FuelPurchase>("fuelPurchases")
    .where({ userId })
    .orderBy("purchaseDate", "desc");
}
