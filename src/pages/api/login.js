// pages/api/auth/login.js
import { ObjectId } from "mongodb";
import { sendMethodNotAllowed, sendOk } from "../../../utils/apiMethods";
import { USERS_COLLECTION } from "../../../utils/constants";
import { getCollection } from "../../../utils/functions";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export default async function handler(req, res) {
  const { method, body } = req;
  
  if (method !== "POST") {
    return sendMethodNotAllowed(res, "Method Not Allowed!");
  }
  
  try {
    // Validate input
    if (!body.email || !body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const collection = await getCollection(USERS_COLLECTION);
    
    // Find user by email
    const user = await collection.findOne({ email: body.email });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(body.password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Update user status to online
    await collection.updateOne(
      { _id: user._id },
      { $set: { isOnline: true } }
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
  user: {
    _id: user._id.toString(), // Convert ObjectId to string
    name: user.name,
    email: user.email,
    // other user data (NOT password)
  },
  token: token // Your JWT token
});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}