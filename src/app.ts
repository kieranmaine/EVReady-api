import express from "express";
import * as dotenv from "dotenv";
import { Journey, validate } from "./models/journey";
import { json } from "body-parser";
import {
  getEVs,
  getJourneys,
  getWeeklyJourneySummary,
  insertJourney,
} from "./repository";
import { userAuthorization } from "./middleware/authorization";
import { RequestCustom } from "./types";

dotenv.config({ path: __dirname + "/../.env" });

const app = express();

app.use(json());

app.get("/", (_, res) => {
  res.send("OK");
});

const secureRouter = express.Router();
secureRouter.use(userAuthorization);

secureRouter.post("/journeys", async (req, res, next) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).json(error);
  }

  try {
    const journey = {
      ...req.body,
      userId: (req as RequestCustom).currentUser.id,
    } as Journey;

    const [journeyId] = await insertJourney(journey);

    res.status(201).send({ id: journeyId });
  } catch (error) {
    next(error);
  }
});

secureRouter.get("/journeys", async (req, res, next) => {
  try {
    res.send(await getJourneys((req as RequestCustom).currentUser.id));
  } catch (error) {
    next(error);
  }
});

secureRouter.get("/journeys/weekly", async (req, res, next) => {
  try {
    res.send(
      await getWeeklyJourneySummary((req as RequestCustom).currentUser.id)
    );
  } catch (error) {
    next(error);
  }
});

secureRouter.get("/evs", async (_, res) => {
  res.json(await getEVs());
});

app.use("/", secureRouter);

export default app;
