import { sendMethodNotAllowed, sendOk } from "../../../utils/apiMethods";
import { USERS_COLLECTION } from "../../../utils/constants";
import { getCollection } from "../../../utils/functions";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const login = async (email, password) => {
  const collection = await getCollection(USERS_COLLECTION);
  
  const user = await collection.findOne({ email });
  
  if (!user) {
    throw new Error("Invalid credentials");
  }
  
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  
  await collection.updateOne(
    { _id: user._id },
    { $set: { isOnline: true } }
  );
  
  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  const { password: pwd, ...userWithoutPassword } = user;
  
  return { user: userWithoutPassword, token };
};

export default async function handler(req, res) {
  const { method, body } = req;
  
  if (method !== "POST") {
    return sendMethodNotAllowed(res, "Method Not Allowed!");
  }
  
  try {
    if (!body.email || !body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const result = await login(body.email, body.password);
    return sendOk(res, result);
  } catch (error) {
    console.error(error);
    
    if (error.message === "Invalid credentials") {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}