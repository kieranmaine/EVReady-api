import Joi, { ValidationResult } from "joi";

export interface User {
  id: string;
  tariffType: TariffType;
  tariffRatePeak: number;
  tariffRateOffPeak: number;
}

export enum TariffType {
  SingleRate = "singleRate",
  Economy7 = "economy7",
}

export function validateUser(obj: Record<string, unknown>): ValidationResult {
  return Joi.object({
    id: Joi.string().uuid(),
    tariffType: Joi.string().valid(TariffType.Economy7, TariffType.SingleRate),
    tariffRatePeak: Joi.number(),
    tariffRateOffPeak: Joi.number(),
  })
    .required()
    .validate(obj, { abortEarly: false });
}
