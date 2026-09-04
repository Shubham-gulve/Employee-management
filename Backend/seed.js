// Seeds the admin login and the Department / State / City master data.
// Safe to re-run: existing documents are matched on name, not recreated.
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import env from "./config/env.js";
import User from "./models/User.js";
import Department from "./models/Department.js";
import State from "./models/State.js";
import City from "./models/City.js";

const DEPARTMENTS = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Customer Support",
  "Research and Development",
];

const STATES = {
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
  Delhi: ["New Delhi", "Dwarka", "Rohini"],
};

const seed = async () => {
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");

  // Admin user - credentials come from the environment in a real deployment.
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  await User.updateOne(
    { email: adminEmail },
    { $set: { name: "Admin", password: await bcrypt.hash(adminPassword, 10) } },
    { upsert: true }
  );
  console.log(`Admin seeded -> ${adminEmail}`);

  for (const name of DEPARTMENTS) {
    await Department.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  console.log(`${DEPARTMENTS.length} departments seeded`);

  for (const [stateName, cities] of Object.entries(STATES)) {
    await State.updateOne({ name: stateName }, { $setOnInsert: { name: stateName } }, { upsert: true });
    const state = await State.findOne({ name: stateName });

    for (const name of cities) {
      await City.updateOne(
        { name, state: state._id },
        { $setOnInsert: { name, state: state._id } },
        { upsert: true }
      );
    }
  }
  console.log(`${Object.keys(STATES).length} states and their cities seeded`);

  await mongoose.disconnect();
  console.log("Seeding complete");
};

seed().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
