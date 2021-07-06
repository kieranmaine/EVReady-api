import express from "express";
import * as dotenv from "dotenv";
import { Journey, validate } from "./models/journey";
import { json } from "body-parser";
import { getEVs, insertJourney } from "./repository";

dotenv.config({ path: __dirname + "/../.env" });

const app = express();

app.use(json());

app.get("/", (_, res) => {
  res.send("OK");
});

app.post("/journeys", async (req, res) => {
  const { error } = validate(req.body);

  if (error) {
    return res.status(400).json(error);
  }

  try {
    const [journeyId] = await insertJourney(req.body as Journey);

    return res.status(201).send({ id: journeyId });
  } catch (err) {
    return res.status(500).send();
  }
});

app.get("/evs", async (_, res) => {
  res.json(await getEVs());
});

export default app;
