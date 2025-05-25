import { ObjectId } from "mongodb";
import { sendMethodNotAllowed, sendOk } from "../../../utils/apiMethods";
import { MESSAGES_COLLECTION } from "../../../utils/constants";
import { getCollection } from "../../../utils/functions";

export default async function handler(req, res) {
  const { method, query, body } = req;
  
  try {
    const collection = await getCollection(MESSAGES_COLLECTION);
    let result;
    
    switch (method) {
      case "GET":
        if (!query.senderId || !query.receiverId) {
          return res.status(400).json({ message: "senderId and receiverId are required" });
        }
        
        result = await collection.find({
          $or: [
            { senderId: query.senderId, receiverId: query.receiverId },
            { senderId: query.receiverId, receiverId: query.senderId }
          ]
        }).sort({ timestamp: 1 }).toArray();
        
        result = result.map(message => ({
          ...message,
          _id: message._id.toString()
        }));
        break;
        
      case "PATCH":
        if (!body.senderId || !body.receiverId) {
          return res.status(400).json({ message: "senderId and receiverId are required" });
        }
        
        result = await collection.updateMany(
          { senderId: body.senderId, receiverId: body.receiverId, read: false },
          { $set: { read: true } }
        );
        break;
        
      default:
        return sendMethodNotAllowed(res, "Method Not Allowed!");
    }
    
    return sendOk(res, result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}