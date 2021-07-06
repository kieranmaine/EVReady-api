import { Request, Response, NextFunction } from "express";
import { getUser } from "../repository";
import { RequestCustom } from "../types";

export const userAuthorization = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (req.headers.authorization == null) {
    res.status(400).send("Authorization header must be included");
    return;
  }

  const [type, userId] = (req.headers.authorization as string).split(" ");

  if (type != "Basic") {
    res.status(400).send("Authorization header must be Basic");
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
