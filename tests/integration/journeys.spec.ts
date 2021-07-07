import supertest from "supertest";
import faker from "faker";
import app from "../../src/app";
import { Journey } from "../../src/models/journey";
import { db } from "../../src/repository";

const userId = "e64b7281-18ab-4d27-b788-b38300e950e1";

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

  const journeyStartDate = new Date(journey.startDate).getTime();

  expect(journey).toEqual(
    expect.objectContaining({ ...expectedJourney, userId })
  );
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
