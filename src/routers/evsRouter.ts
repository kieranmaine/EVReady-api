import express from "express";
import { ElectricVehicleStats } from "../models/electricVehicle";
import { getEVs, getEVStats } from "../repository";
import { RequestCustom, RequestCustomMakeModel } from "../types";

export const evsRouter = express.Router();

evsRouter.get("/", async (req, res) => {
  const userId = (req as RequestCustom).currentUser.id;
  res.json(await getEVs(userId));
});

evsRouter.get("/:make/:model", async (req, res) => {
  const userId = (req as RequestCustomMakeModel).currentUser.id;

  const evs = await getEVs(userId, req.params.make, req.params.model);

  const stats = await getEVStats(userId, req.params.make, req.params.model);

  if (evs.length == 0) {
    res.status(404).send();
  } else {
    res.json({
      ...evs[0],
      ...stats,
    } as ElectricVehicleStats);
  }
});
