import dotenv from "dotenv";
import mongoose from "mongoose";
import crypto from "crypto";
import OfficialInvite from "../models/OfficialInvite.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const SEED_SIGNATURE = process.env.SEED_SIGNATURE;
const TOKEN_EXPIRY_DAYS = parseInt(process.env.TOKEN_EXPIRY_DAYS || "30", 10);

if (process.argv[2] !== "--verify" || process.argv[3] !== SEED_SIGNATURE) {
  console.error("❌ Unauthorized seeding attempt!");
  process.exit(1);
}

const generateToken = (role) =>
  `${role.toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const seedInvites = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const now = new Date();
    const validUntil = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invites = [
      {
        email: "chairman@example.com",
        role: "Chairman",
        token: generateToken("CHAIRMAN"),
        termStart: new Date("2025-01-01"),
        termEnd: new Date("2025-12-31"),
        validUntil,
        ipAddress: "127.0.0.1",
      },
      {
        email: "treasurer@example.com",
        role: "Treasurer",
        token: generateToken("TREASURER"),
        termStart: new Date("2025-01-01"),
        termEnd: new Date("2025-12-31"),
        validUntil,
        ipAddress: "127.0.0.1",
      },
    ];

    await OfficialInvite.insertMany(invites);
    console.log("✅ Invites created successfully:");
    console.table(invites.map(({ email, role, token, validUntil }) => ({ email, role, token, validUntil })));
    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding invites:", err);
    process.exit(1);
  }
};

export default seedInvites;
