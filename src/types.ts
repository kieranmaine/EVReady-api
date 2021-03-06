import { Request } from "express";
import { User } from "./models/user";

export interface RequestCustom extends Request {
  currentUser: User;
}

export interface RequestCustomMakeModel extends RequestCustom {
  params: {
    make: string;
    model: string;
  };
}
