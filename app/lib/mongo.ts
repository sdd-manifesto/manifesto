import {
    Db,
    MongoClient,
} from "mongodb";

const url = process.env.MONGODB_URI || "mongodb://localhost:27017/manifesto";
const mongoClient = new MongoClient(url, { useNewUrlParser: true });

export async function client(): Promise<MongoClient> {
    if (!mongoClient.isConnected()) {
        await mongoClient.connect();
        console.log(`Connected to Mongo DB`);
    }
    return mongoClient;
}

export async function database(): Promise<Db> {
    return (await client()).db();
}
