/// <reference types="jest" />
/// <reference types="node" />

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    const dbUri = mongoServer.getUri();
    const dbName = "bildyapp_test";

    if (!dbUri || !dbName) {
        throw new Error("DB_URI y DB_NAME son obligatorios en tests");
    }

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