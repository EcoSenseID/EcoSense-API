// @ts-nocheck

// we will use supertest to test HTTP requests/responses
import request from "supertest";
// we also need our app for the correct routes!
import app from "../app";

describe('Sample Test', () => {
  it('Testing to see if Jest works', () => {
    expect(1).toBe(1);
  })
});

// describe("GET / ", () => {
//     test("It should respond with an array of students", async () => {
//       const response = await request(app).get("/");
//       expect(response.statusCode).toBe(200);

//       expect(response.body).toHaveProperty("status");
//       expect(response.body.status).toBe("success");

//       expect(response.body).toHaveProperty("info");

//       expect(response.body).toHaveProperty("contributors");
//       expect(response.body.contributors).toHaveProperty("name");
//       expect(response.body.contributors.name.length).toBe(6);
//       expect(response.body.contributors).toHaveProperty("team");

//       expect(response.body).toHaveProperty("copyright");
//     });
// });