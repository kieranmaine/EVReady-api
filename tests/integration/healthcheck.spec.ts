import supertest from "supertest";
import app from "../../src/app";

test("GET /", async () => {
  await supertest(app).get("/").expect(200, "OK");
});
