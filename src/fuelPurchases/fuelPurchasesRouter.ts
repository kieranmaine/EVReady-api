import express from "express";
import { userAuthorization } from "../middleware/authorization";
import { FuelPurchase, validateFuelPurchase } from "../models/fuelPurchase";
import {
  getFuelPurchases,
  getFuelPurchasesTotal,
  insertFuelPurchase,
} from "../repository";
import { RequestCustom } from "../types";

export const fuelPurchasesRouter = express.Router();

fuelPurchasesRouter.use(userAuthorization);

fuelPurchasesRouter.post("/", async (req, res) => {
  const { error } = validateFuelPurchase(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const userId = (req as RequestCustom).currentUser.id;

  const fuelPurchase = {
    userId,
    ...req.body,
  } as FuelPurchase;

  const createdFuelPurchase = await insertFuelPurchase(fuelPurchase);

  res.status(201).send(createdFuelPurchase);
});

fuelPurchasesRouter.get("/", async (req, res) => {
  const results = await getFuelPurchases((req as RequestCustom).currentUser.id);

  res.status(200).send(results);
});

fuelPurchasesRouter.get("/total", async (req, res) => {
  const result = await getFuelPurchasesTotal(
    (req as RequestCustom).currentUser.id
  );

  res.status(200).send(result);
});
