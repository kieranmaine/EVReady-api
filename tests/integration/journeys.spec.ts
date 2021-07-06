import supertest from "supertest";
import faker from "faker";
import app from "../../src/app";
import { Journey } from "../../src/models/journey";
import { db } from "../../src/repository";

test("GET /", async () => {
  await supertest(app).get("/").expect(200, "OK");
});

test("POST /journeys - Valid request", async () => {
  const startTime = new Date();

  const expectedJourney = {
    durationSeconds: faker.datatype.number(3600),
    distanceMeters: faker.datatype.number(100000),
    finishedAtHome: faker.datatype.boolean(),
  };

  const res = await supertest(app).post("/journeys").send(expectedJourney);

  expect(res.status).toEqual(201);

  const id = res.body.id;

  const journey = (await (await db())("journeys")
    .where("id", id)
    .first()) as Journey;

  const journeyStartDate = new Date(journey.startDate).getTime();

  expect(journey).toEqual(expect.objectContaining(expectedJourney));
  expect(journeyStartDate).toBeGreaterThan(startTime.getTime());
  expect(journeyStartDate).toBeLessThan(Date.now());
});

test("POST /journeys - Missing required fields", async () => {
  const res = await supertest(app).post("/journeys").send({});

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
  const res = await supertest(app).post("/journeys").send({
    durationSeconds: "Wrong type",
    distanceMeters: "Wrong type",
    finishedAtHome: "Wrong type",
  });

  expect(res.status).toEqual(400);

  expect(res.body.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: '"durationSeconds" must be a number',
      }),
      expect.objectContaining({ message: '"distanceMeters" must be a number' }),
      expect.objectContaining({
        message: '"finishedAtHome" must be a boolean',
      }),
    ])
  );
});
