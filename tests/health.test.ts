import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";

describe("Health", () => {
    it("debería devolver 200 si MongoDB está conectado", async () => {
        expect(mongoose.connection.readyState).toBe(1);

        const response = await request(app).get("/health");

        expect(response.status).toBe(200);
    });

    it("debería devolver 503 si MongoDB está desconectado", async () => {
        try {
            await mongoose.connection.close();

            expect(mongoose.connection.readyState).toBe(0);

            const response = await request(app).get("/health");

            expect(response.status).toBe(503);
        } finally {
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(global.__MONGO_URI__, {
                    dbName: global.__MONGO_DB_NAME__,
                });
            }
        }
    });
})