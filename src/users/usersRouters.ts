import express from "express";
import { userAuthorization } from "../middleware/authorization";
import { User, validateUser } from "../models/user";
import { getUser, updateUser } from "../repository";
import { RequestCustom } from "../types";

export const usersRouter = express.Router();

usersRouter.use(userAuthorization);

usersRouter.get("/", async (req, res) => {
  const user = await getUser((req as RequestCustom).currentUser.id);

  res.status(200).send(user);
});

usersRouter.put("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) {
    return res.status(400).json(error);
  }

  const userId = (req as RequestCustom).currentUser.id;

  const user = {
    id: userId,
    ...req.body,
  } as User;

  await updateUser(user);

  res.status(200).send(user);
});
