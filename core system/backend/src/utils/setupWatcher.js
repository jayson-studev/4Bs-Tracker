import fs from "fs";
import dotenv from "dotenv";
import Official from "../models/Official.js";

dotenv.config();

export const autoLockSetup = async () => {
  try {
    const officials = await Official.find({ role: { $in: ["Chairman", "Treasurer"] } });

    // Check if both key roles are now registered
    const hasChairman = officials.some((o) => o.role === "Chairman");
    const hasTreasurer = officials.some((o) => o.role === "Treasurer");

    if (hasChairman && hasTreasurer && process.env.SETUP_MODE === "true") {
      const envPath = ".env";
      let envContent = fs.readFileSync(envPath, "utf-8");
      envContent = envContent.replace("SETUP_MODE=true", "SETUP_MODE=false");
      fs.writeFileSync(envPath, envContent);

      console.log("🔒 System setup completed. SETUP_MODE automatically locked.");
    }
  } catch (err) {
    console.error("❌ Error auto-locking setup mode:", err);
  }
};
