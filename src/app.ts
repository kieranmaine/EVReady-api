import express from "express";
import * as dotenv from "dotenv";
import { json } from "body-parser";
import { userAuthorization } from "./middleware/authorization";
import { usersRouter } from "./routers/usersRouters";
import { fuelPurchasesRouter } from "./routers/fuelPurchasesRouter";
import { journeysRouter } from "./routers/journeysRouter";
import { evsRouter } from "./routers/evsRouter";

dotenv.config({ path: __dirname + "/../.env" });

const app = express();

app.use(json());

app.get("/", (_, res) => {
  res.send("OK");
});

const secureRouter = express.Router();
secureRouter.use(userAuthorization);
secureRouter.use("/journeys", journeysRouter);
secureRouter.use("/evs", evsRouter);
secureRouter.use("/users", usersRouter);
secureRouter.use("/fuel", fuelPurchasesRouter);

app.use("/", secureRouter);

export default app;
