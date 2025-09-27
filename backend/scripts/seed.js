import mongoose from "mongoose";
import dotenv from "dotenv";
import User, { upsertUserByUsername } from "../models/User.js";

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: "pixelpal" });
  console.log("Connected to MongoDB");

  const users = [
    {
      username: "alice",
      location: "Toronto",
      tags: ["JRPG", "Cozy", "Stardew"],
      bio: "I love cozy RPGs!",
      avatar: { base: "chibi1.png", hair: "purple_long.png", clothes: "hoodie.png" },
      vibeTags: ["cozy", "night-owl
