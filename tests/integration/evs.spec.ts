import supertest from "supertest";
import app from "../../src/app";
import { insertFuelPurchase, insertJourney } from "../../src/repository";
import { userId } from "./setup";
import { databaseCleanup } from "./utils";
import { createJourney, evs, createUser } from "./testData";
import {
  ElectricVehicle,
  ElectricVehicleStats,
} from "../../src/models/electricVehicle";
import { TariffType, User } from "../../src/models/user";

beforeEach(async () => {
  await databaseCleanup();
});

test("GET /evs - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .get("/evs")
    .set("X-API-Key", "56ffcc8f-d761-4e5b-be00-10ec0390dde2")
    .send({});

  expect(res.status).toEqual(401);
});

test("GET /evs - Authorised", async () => {
  const journeysToCreate = [
    // 75 miles - over two journeys in one day
    createJourney({ distanceMeters: 60338, startDate: new Date(2021, 6, 2) }),
    createJourney({ distanceMeters: 60338, startDate: new Date(2021, 6, 2) }),
    // Create journey for different user, to check journey is filtered out
    createJourney({
      distanceMeters: 60338,
      startDate: new Date(2021, 6, 2),
      userId: await createUser(),
    }),
    // 200 miles
    createJourney({ distanceMeters: 321800, startDate: new Date(2021, 6, 3) }),
    // 220 miles
    createJourney({ distanceMeters: 353980, startDate: new Date(2021, 6, 4) }),
    // 260 miles - over two journeys in one day
    createJourney({ distanceMeters: 209170, startDate: new Date(2021, 6, 5) }),
    createJourney({ distanceMeters: 209170, startDate: new Date(2021, 6, 5) }),
  ];

  for (const journey of journeysToCreate) {
    await insertJourney(journey);
  }

  const res = await supertest(app)
    .get("/evs")
    .set("X-API-Key", userId)
    .send({});

  expect(res.status).toEqual(200);

  // Results are sorted by singleCharge days then price
  expect(res.body).toEqual([
    { ...evs.tesla, singleChargeDaysPercentage: 100 },
    { ...evs.renault, singleChargeDaysPercentage: 75 },
    { ...evs.porsche, singleChargeDaysPercentage: 75 },
    { ...evs.vw_id3, singleChargeDaysPercentage: 50 },
    { ...evs.vw_egolf, singleChargeDaysPercentage: 25 },
    { ...evs.honda_e, singleChargeDaysPercentage: 25 },
    { ...evs.nissan, singleChargeDaysPercentage: 25 },
    { ...evs.peugeot, singleChargeDaysPercentage: 25 },
    { ...evs.smart, singleChargeDaysPercentage: 0 },
  ] as ElectricVehicle[]);
});

test("GET /evs/Nissan/Leaf - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .get("/evs/nissan/leaf")
    .set("X-API-Key", "56ffcc8f-d761-4e5b-be00-10ec0390dde2")
    .send({});

  expect(res.status).toEqual(401);
});

[
  {
    userData: {
      tariffType: TariffType.Economy7,
      tariffRateOffPeak: 12.3,
      tariffRatePeak: 24.6,
    } as User,
    expected: {
      chargingCostsMin: 20.54,
      chargingCostsMax: 41.09,
      savingsMin: 58.91,
      savingsMax: 79.46,
    },
  },
  {
    userData: {
      tariffType: TariffType.SingleRate,
      tariffRateOffPeak: 12.3,
      tariffRatePeak: 36.9,
    } as User,
    expected: {
      chargingCostsMin: 61.63,
      chargingCostsMax: 61.63,
      savingsMin: 38.37,
      savingsMax: 38.37,
    },
  },
].forEach(({ userData, expected }) => {
  test(`GET /evs/Nissan/Leaf - Authorised with ${userData.tariffType} user`, async () => {
    const userId = await createUser(userData);
    const anotherUserId = await await createUser();

    insertFuelPurchase({
      purchaseDate: new Date(2021, 6, 1),
      cost: 50,
      userId,
    });
    insertFuelPurchase({
      purchaseDate: new Date(2021, 6, 2),
      cost: 5,
      userId: anotherUserId,
    });
    insertFuelPurchase({
      purchaseDate: new Date(2021, 6, 3),
      cost: 50,
      userId,
    });

    const journeysToCreate = [
      // 75 miles - over two journeys in one day
      createJourney({
        userId,
        finishedAtHome: false,
        distanceMeters: 60338,
        startDate: new Date(2021, 6, 6),
      }),
      createJourney({
        userId,
        finishedAtHome: true,
        distanceMeters: 60338,
        startDate: new Date(2021, 6, 7),
      }),
      // Create journey for different user, to check journey is filtered out
      createJourney({
        distanceMeters: 60338,
        startDate: new Date(2021, 6, 2),
        userId: anotherUserId,
      }),
      // 200 miles
      createJourney({
        userId,
        finishedAtHome: false,
        distanceMeters: 321800,
        startDate: new Date(2021, 6, 13),
      }),
      // 120 miles
      createJourney({
        userId,
        finishedAtHome: true,
        distanceMeters: 193080,
        startDate: new Date(2021, 6, 14),
      }),
      // 260 miles - over two journeys in one day
      createJourney({
        userId,
        finishedAtHome: false,
        distanceMeters: 209170,
        startDate: new Date(2021, 6, 20),
      }),
      createJourney({
        userId,
        finishedAtHome: true,
        distanceMeters: 209170,
        startDate: new Date(2021, 6, 21),
      }),
    ];

    for (const journey of journeysToCreate) {
      await insertJourney(journey);
    }

    const res = await supertest(app)
      .get("/evs/Nissan/Leaf")
      .set("X-API-Key", userId)
      .send({});

    expect(res.status).toEqual(200);

    expect(res.body).toEqual({
      ...evs.nissan,
      singleChargeDaysPercentage: 83,
      meanWeeklyCharges: 1.64,
      totalAwayCharges: 3,
      ...expected,
    } as ElectricVehicleStats);
  });
});
