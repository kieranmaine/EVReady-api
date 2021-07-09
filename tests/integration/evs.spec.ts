import supertest from "supertest";
import faker from "faker";
import app from "../../src/app";
import { db, insertJourney } from "../../src/repository";
import { userId } from "./setup";
import { databaseCleanup } from "./utils";
import { createJourney, evs, insertAnotherUser } from "./testData";
import { ElectricVehicle } from "../../src/models/electricVehicle";

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
  const otherUserId = await insertAnotherUser();

  const journeysToCreate = [
    // 75 miles - over two journeys in one day
    createJourney({ distanceMeters: 60338, startDate: new Date(2021, 6, 2) }),
    createJourney({ distanceMeters: 60338, startDate: new Date(2021, 6, 2) }),
    // Create journey for different user, to check journey is filtered out
    createJourney({
      distanceMeters: 60338,
      startDate: new Date(2021, 6, 2),
      userId: otherUserId,
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
