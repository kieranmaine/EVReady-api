import supertest from "supertest";
import faker from "faker";
import app from "../../src/app";
import { client, userId } from "./setup";
import { databaseCleanup } from "./utils";
import { FuelPurchase } from "../../src/models/fuelPurchase";

beforeEach(async () => {
  await databaseCleanup();
});

test("POST /fuel - Unauthorised", async () => {
  // UUID is invalid and doesn't exist
  const res = await supertest(app)
    .post("/fuel")
    .set("X-API-Key", "56ffcc8f-d761-4e5b-be00-10ec0390dde2")
    .send({});

  expect(res.status).toEqual(401);
});

test("POST /fuel - Missing required fields", async () => {
  const res = await supertest(app)
    .post("/fuel")
    .set("X-API-Key", userId)
    .send({});

  expect(res.status).toEqual(400);

  expect(res.body.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: '"cost" is required' }),
    ])
  );
});

test("POST /fuel - Invalid fields", async () => {
  const res = await supertest(app).post("/fuel").set("X-API-Key", userId).send({
    cost: -123,
  });

  expect(res.status).toEqual(400);

  expect(res.body.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ message: '"cost" must be greater than 0' }),
    ])
  );
});

test("POST /fuel - Valid request", async () => {
  const expectedCost = faker.datatype.number({ precision: 0.01 });

  const res = await supertest(app)
    .post("/fuel")
    .set("X-API-Key", userId)
    .send({ cost: expectedCost });

  expect(res.status).toEqual(201);

  const purchaseDate = res.body.purchaseDate;

  const fuelPurchase = (
    await client("fuelPurchases").where({
      purchaseDate,
      userId,
    })
  )[0] as FuelPurchase;

  expect(fuelPurchase).toEqual(
    expect.objectContaining({
      purchaseDate: new Date(purchaseDate),
      cost: expectedCost,
      userId,
    })
  );
});
