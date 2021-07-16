import supertest from "supertest";
import faker from "faker";
import app from "../../src/app";
import { databaseCleanup } from "./utils";
import { TariffType, User } from "../../src/models/user";
import { getUser } from "../../src/repository";
import { client } from "./setup";

beforeEach(async () => {
  await databaseCleanup();
});

test("GET /users - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .get("/users")
    .set("X-API-Key", faker.datatype.uuid())
    .send({});

  expect(res.status).toEqual(401);
});

test("GET /users - Valid request", async () => {
  const user = {
    id: faker.datatype.uuid(),
    tariffType: faker.random.arrayElement([
      TariffType.Economy7,
      TariffType.SingleRate,
    ]),
    tariffRateOffPeak: faker.datatype.number({
      min: 1,
      max: 20,
      precision: 0.01,
    }),
    tariffRatePeak: faker.datatype.number({ min: 1, max: 20, precision: 0.01 }),
  } as User;

  await client("users").insert(user);

  const res = await supertest(app)
    .get("/users")
    .set("X-API-Key", user.id)
    .send({});

  expect(res.status).toEqual(200);

  expect(res.body).toEqual(user);
});

test("PUT /users - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .put("/users")
    .set("X-API-Key", faker.datatype.uuid())
    .send({});

  expect(res.status).toEqual(401);
});

test("GET /users - Invalid request", async () => {
  const userId = faker.datatype.uuid();

  // Insert user with no data
  await client("users").insert({ id: userId });

  const res = await supertest(app).put("/users").set("X-API-Key", userId).send({
    tariffType: "InvalidType",
    tariffRateOffPeak: false,
    tariffRatePeak: "NotANumber",
  });

  expect(res.status).toEqual(400);
  expect(res.body.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: '"tariffType" must be one of [economy7, singleRate]',
      }),
      expect.objectContaining({
        message: '"tariffRateOffPeak" must be a number',
      }),
      expect.objectContaining({ message: '"tariffRatePeak" must be a number' }),
    ])
  );
});

test("GET /users - Valid request", async () => {
  const user = {
    id: faker.datatype.uuid(),
    tariffType: faker.random.arrayElement([
      TariffType.Economy7,
      TariffType.SingleRate,
    ]),
    tariffRateOffPeak: faker.datatype.number({
      min: 1,
      max: 20,
      precision: 0.01,
    }),
    tariffRatePeak: faker.datatype.number({ min: 1, max: 20, precision: 0.01 }),
  } as User;

  // Insert user with no data
  await client("users").insert({ id: user.id });

  const res = await supertest(app)
    .put("/users")
    .set("X-API-Key", user.id)
    .send(user);

  expect(res.status).toEqual(200);
  expect(res.body).toEqual(user);

  const dbUser = await getUser(user.id);
  expect(dbUser).toEqual(user);
});
