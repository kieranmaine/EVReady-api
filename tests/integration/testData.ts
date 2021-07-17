import faker from "faker";
import { Journey } from "../../src/models/journey";
import { userId } from "./setup";
import { ElectricVehicle } from "../../src/models/electricVehicle";
import { db } from "../../src/repository";
import { User } from "../../src/models/user";

export const createJourney = (overrideFields = {}): Journey => ({
  durationSeconds: faker.datatype.number(3600),
  distanceMeters: faker.datatype.number(100000),
  finishedAtHome: faker.datatype.boolean(),
  userId,
  ...overrideFields,
});

export const evs: Record<string, ElectricVehicle> = {
  tesla: {
    make: "Tesla",
    model: "Model 3 Standard Range Plus",
    range: 267,
    price: 41932,
    efficiency: 234,
  },
  vw_id3: {
    make: "Volkswagen",
    model: "ID.3 Pure",
    range: 205,
    price: 25123,
    efficiency: 223,
  },
  renault: {
    make: "Renault",
    model: "Zoe ZE50 R110",
    range: 245,
    price: 26230,
    efficiency: 235,
  },
  porsche: {
    make: "Porsche",
    model: "Taycan Turbo",
    range: 237,
    price: 113098,
    efficiency: 345,
  },
  vw_egolf: {
    make: "Volkswagen",
    model: "e-Golf",
    range: 144,
    price: 27123,
    efficiency: 273,
  },
  honda_e: {
    make: "Honda",
    model: "e",
    range: 137,
    price: 27489,
    efficiency: 275,
  },
  nissan: {
    make: "Nissan",
    model: "Leaf",
    range: 133,
    price: 28923,
    efficiency: 255,
  },
  peugeot: {
    make: "Peugeot",
    model: "e-2008 SUV",
    range: 193,
    price: 28999,
    efficiency: 295,
  },
  smart: {
    make: "Smart",
    model: "EQ forfour",
    range: 55,
    price: 17389,
    efficiency: 305,
  },
};

export const createUser = async (user?: Partial<User>): Promise<string> => {
  const otherUserId = faker.datatype.uuid();
  await (await db())("users").insert({ id: otherUserId, ...user });
  return otherUserId;
};
