// pages/api/users.js
import { ObjectId } from "mongodb";
import { sendMethodNotAllowed, sendOk } from "../../../utils/apiMethods";
import { USERS_COLLECTION } from "../../../utils/constants";
import { getCollection } from "../../../utils/functions";

export default async function handler(req, res) {
  const { method, query } = req;
  
  try {
    const collection = await getCollection(USERS_COLLECTION);
    let result;
    
    switch (method) {
      case "GET":
        if (query.id) {
          // Get user by ID
          result = await collection.findOne({ _id: new ObjectId(query.id) });
          
          if (!result) {
            return res.status(404).json({ message: "User not found" });
          }
          
          // Don't return password
          const { password, ...userWithoutPassword } = result;
          result = { ...userWithoutPassword, _id: userWithoutPassword._id.toString() };
        } else {
          // Get all users
          result = await collection.find({}).toArray();
          
          // Don't return passwords and convert ObjectId to string
          result = result.map(user => {
            const { password, ...userWithoutPassword } = user;
            return { ...userWithoutPassword, _id: userWithoutPassword._id.toString() };
          });
        }
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