import express from "express";
import * as dotenv from "dotenv";
import { Journey, validate } from "./models/journey";
import { json } from "body-parser";
import {
  getEVStats,
  getEVs,
  getJourneys,
  getWeeklyJourneySummary,
  insertJourney,
} from "./repository";
import { userAuthorization } from "./middleware/authorization";
import { RequestCustom, RequestCustomMakeModel } from "./types";
import { ElectricVehicleStats } from "./models/electricVehicle";

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

secureRouter.get("/evs", async (req, res) => {
  const userId = (req as RequestCustom).currentUser.id;
  res.json(await getEVs(userId));
});

secureRouter.get("/evs/:make/:model", async (req, res) => {
  const userId = (req as RequestCustomMakeModel).currentUser.id;

  const evs = await getEVs(userId, req.params.make, req.params.model);

  const { totalAwayCharges, meanWeeklyCharges } = await getEVStats(
    userId,
    req.params.make,
    req.params.model
  );

  if (evs.length == 0) {
    res.status(404).send();
  } else {
    res.json({
      ...evs[0],
      totalAwayCharges,
      meanWeeklyCharges,
    } as ElectricVehicleStats);
  }
});

app.use("/", secureRouter);

export default app;
