import Joi, { ValidationResult } from "joi";

export interface FuelPurchase {
  purchaseDate?: Date;
  cost: number;
  userId: string;
}

export function validateFuelPurchase(
  obj: Record<string, unknown>
): ValidationResult {
  return Joi.object({
    cost: Joi.number().greater(0).required(),
  })
    .required()
    .validate(obj, { abortEarly: false });
}
