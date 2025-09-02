import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI in .env");

  await mongoose.connect(uri, {
    dbName: "walletDB", // you can rename
  });

  isConnected = true;
  console.log("✅ MongoDB connected");
}
