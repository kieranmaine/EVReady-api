import express from "express";
import { Journey, validateJourney } from "../models/journey";
import {
  getJourneys,
  getWeeklyJourneySummary,
  insertJourney,
} from "../repository";
import { RequestCustom } from "../types";

export const journeysRouter = express.Router();

journeysRouter.post("/", async (req, res, next) => {
  const { error } = validateJourney(req.body);

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

journeysRouter.get("/", async (req, res, next) => {
  try {
    res.send(await getJourneys((req as RequestCustom).currentUser.id));
  } catch (error) {
    next(error);
  }
});

journeysRouter.get("/weekly", async (req, res, next) => {
  try {
    res.send(
      await getWeeklyJourneySummary((req as RequestCustom).currentUser.id)
    );
  } catch (error) {
    next(error);
  }
});
