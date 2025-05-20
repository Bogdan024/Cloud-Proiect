import { connectToDatabase } from "../lib/mongodb"

export const getCollection = async (collectionName) => {
    const { database } = await connectToDatabase();
    return database.collection(collectionName);
}

 