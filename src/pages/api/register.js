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
    if (!body.name || !body.email || !body.password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }
    
    const collection = await getCollection(USERS_COLLECTION);
    
    const existingUser = await collection.findOne({ email: body.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(body.password, salt);
    
    const newUser = {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      isOnline: true,
      lastSeen: new Date()
    };
    
    const result = await collection.insertOne(newUser);
    
    const token = jwt.sign(
      { id: result.insertedId.toString(), email: body.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    const { password, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({
  user: {
    _id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
  },
  token: token
});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}