/// <reference types="jest" />
/// <reference types="node" />

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

declare global {
    var __MONGO_URI__: string;

    var __MONGO_DB_NAME__: string;
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    const dbUri = mongoServer.getUri();
    const dbName = "bildyapp_test";

    if (!dbUri || !dbName) {
        throw new Error("DB_URI y DB_NAME son obligatorios en tests");
    }

    global.__MONGO_URI__ = dbUri;
    global.__MONGO_DB_NAME__ = dbName;

    await mongoose.connect(dbUri, {dbName});
});

afterEach(async () => {
    const collections = mongoose.connection.collections;

    for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});