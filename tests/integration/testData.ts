import faker from "faker";
import { Journey } from "../../src/models/journey";
import { userId } from "./setup";

export const createJourney = (overrideFields = {}): Journey => ({
  durationSeconds: faker.datatype.number(3600),
  distanceMeters: faker.datatype.number(100000),
  finishedAtHome: faker.datatype.boolean(),
  userId,
  ...overrideFields,
});
