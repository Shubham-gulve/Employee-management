import mongoose from "mongoose";

// State Master collection - feeds the State dropdown.
const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

export default mongoose.model("State", stateSchema);
