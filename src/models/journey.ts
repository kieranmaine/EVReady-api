import Joi, { ValidationResult } from "joi";

export interface Journey {
  id?: string;
  userId: string;
  startDate?: Date;
  durationSeconds: number;
  distanceMeters: number;
  finishedAtHome: boolean;
}

export interface WeeklyJourneysSummary {
  weekStartDate: Date;
  journeysCount: number;
  totalMiles: number;
}

export function validate(obj: Record<string, unknown>): ValidationResult {
  return Joi.object({
    durationSeconds: Joi.number().integer().required(),
    distanceMeters: Joi.number().integer().required(),
    finishedAtHome: Joi.boolean().required(),
  })
    .required()
    .validate(obj, { abortEarly: false });
}
