import supertest from "supertest";
import faker from "faker";
import app from "../../src/app";
import { Journey } from "../../src/models/journey";
import { db, insertJourney } from "../../src/repository";
import { userId } from "./setup";
import { databaseCleanup } from "./utils";
import { createJourney } from "./testData";

beforeEach(async () => {
  await databaseCleanup();
});

test("POST /journeys - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .post("/journeys")
    .set("X-API-Key", "56ffcc8f-d761-4e5b-be00-10ec0390dde2")
    .send({});

  expect(res.status).toEqual(401);
});

test("POST /journeys - Valid request", async () => {
  const startTime = new Date();

  const expectedJourney = {
    durationSeconds: faker.datatype.number(3600),
    distanceMeters: faker.datatype.number(100000),
    finishedAtHome: faker.datatype.boolean(),
  };

  const res = await supertest(app)
    .post("/journeys")
    .set("X-API-Key", userId)
    .send(expectedJourney);

  expect(res.status).toEqual(201);

  const id = res.body.id;

  const journey = (await (await db())("journeys")
    .where("id", id)
    .first()) as Journey;

  expect(journey).toEqual(
    expect.objectContaining({ ...expectedJourney, userId })
  );

  const journeyStartDate = new Date(journey.startDate ?? 0).getTime();
  expect(journeyStartDate).toBeGreaterThan(startTime.getTime());
  expect(journeyStartDate).toBeLessThan(Date.now());
});

test("POST /journeys - Missing required fields", async () => {
  const res = await supertest(app)
    .post("/journeys")
    .set("X-API-Key", userId)
    .send({});

  expect(res.status).toEqual(400);

  expect(res.body.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: '"durationSeconds" is required' }),
      expect.objectContaining({ message: '"distanceMeters" is required' }),
      expect.objectContaining({ message: '"finishedAtHome" is required' }),
    ])
  );
});

test("POST /journeys - Invalid fields", async () => {
  const res = await supertest(app)
    .post("/journeys")
    .set("X-API-Key", userId)
    .send({
      durationSeconds: 123.456,
      distanceMeters: false,
      finishedAtHome: "Wrong type",
    });

  expect(res.status).toEqual(400);

  expect(res.body.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: '"durationSeconds" must be an integer',
      }),
      expect.objectContaining({ message: '"distanceMeters" must be a number' }),
      expect.objectContaining({
        message: '"finishedAtHome" must be a boolean',
      }),
    ])
  );
});

test("GET /journeys - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .get("/journeys")
    .set("X-API-Key", "56ffcc8f-d761-4e5b-be00-10ec0390dde2")
    .send();

  expect(res.status).toEqual(401);
});

test("GET /journeys - Valid request", async () => {
  const journey1 = createJourney();
  await insertJourney(journey1);

  const otherUserId = faker.datatype.uuid();
  await (await db())("users").insert({ id: otherUserId });
  await insertJourney(createJourney({ userId: otherUserId }));

  const journey2 = createJourney();
  await insertJourney(journey2);

  const res = await supertest(app)
    .get("/journeys")
    .set("X-API-Key", userId)
    .send();

  expect(res.status).toEqual(200);

  const results = res.body as Journey[];

  expect(results).toHaveLength(2);
  expect(results[0]).toEqual(expect.objectContaining(journey2));
  expect(results[1]).toEqual(expect.objectContaining(journey1));
});

test("GET /journeys/weekly - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .get("/journeys/weekly")
    .set("X-API-Key", "56ffcc8f-d761-4e5b-be00-10ec0390dde2")
    .send();

  expect(res.status).toEqual(401);
});

test("GET /journeys/weekly - Valid request", async () => {
  await insertJourney(
    createJourney({
      distanceMeters: 1609,
      startDate: new Date(2021, 6, 7, 13, 0),
    })
  );
  await insertJourney(
    createJourney({
      distanceMeters: 16090,
      startDate: new Date(2021, 6, 7, 13, 0),
    })
  );
  await insertJourney(
    createJourney({
      distanceMeters: 3218,
      startDate: new Date(2021, 6, 1, 13, 0),
    })
  );

  const res = await supertest(app)
    .get("/journeys/weekly")
    .set("X-API-Key", userId)
    .send();

  expect(res.status).toEqual(200);

  expect(res.body).toEqual([
    {
      weekStartDate: new Date(2021, 6, 5, 1, 0).toISOString(),
      journeysCount: 2,
      totalMiles: 11,
    },
    {
      weekStartDate: new Date(2021, 5, 28, 1, 0).toISOString(),
      journeysCount: 1,
      totalMiles: 2,
    },
  ]);
});
