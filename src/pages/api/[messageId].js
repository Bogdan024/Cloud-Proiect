import { ObjectId } from "mongodb";
import { sendMethodNotAllowed, sendOk } from "../../../utils/apiMethods";
import { MESSAGES_COLLECTION } from "../../../utils/constants";
import { getCollection } from "../../../utils/functions";

export default async function handler(req, res) {
  const { method, query, body } = req;
  const { messageId } = query;
  
  if (!messageId) {
    return res.status(400).json({ message: "Message ID is required" });
  }
  
  try {
    const collection = await getCollection(MESSAGES_COLLECTION);
    let result;
    
    let objectId;
    try {
      objectId = new ObjectId(messageId);
    } catch (error) {
      return res.status(400).json({ message: "Invalid message ID format" });
    }
    
    const message = await collection.findOne({ _id: objectId });
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    
    switch (method) {
      case "GET":
        result = {
          ...message,
          _id: message._id.toString()
        };
        break;
        
      case "PUT":
        if (!body.content || body.content.trim() === "") {
          return res.status(400).json({ message: "Message content is required" });
        }
        
        if (body.userId !== message.senderId) {
          return res.status(403).json({ message: "You can only edit your own messages" });
        }
        
        await collection.updateOne(
          { _id: objectId },
          { 
            $set: { 
              content: body.content,
              updatedAt: new Date(),
              isEdited: true
            } 
          }
        );
        
        const updatedMessage = await collection.findOne({ _id: objectId });
        result = {
          ...updatedMessage,
          _id: updatedMessage._id.toString()
        };
        break;
        
      case "DELETE":
        if (body.userId !== message.senderId) {
          return res.status(403).json({ message: "You can only delete your own messages" });
        }
        
        await collection.deleteOne({ _id: objectId });
        result = { success: true, message: "Message deleted successfully" };
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