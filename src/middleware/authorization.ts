import { Request, Response, NextFunction } from "express";
import { getUser } from "../repository";
import { RequestCustom } from "../types";

export const userAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.headers["x-api-key"] as string;

  if (!userId) {
    res.status(401).send("X-API-Key header required");
    return;
  }

  const user = await getUser(userId);

  if (!user) {
    res.status(401).send();
    return;
  }

  (req as RequestCustom).currentUser = user;
  next();
};
