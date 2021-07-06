import Joi, { ValidationResult } from "joi";

export interface Journey {
  id?: string;
  userId: string;
  startDate: Date;
  durationSeconds: number;
  distanceMeters: number;
  finishedAtHome: boolean;
}

export function validate(obj: Record<string, unknown>): ValidationResult {
  return Joi.object({
    durationSeconds: Joi.number().required(),
    distanceMeters: Joi.number().required(),
    finishedAtHome: Joi.boolean().required(),
  })
    .required()
    .validate(obj, { abortEarly: false });
}
