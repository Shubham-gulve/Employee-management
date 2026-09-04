import mongoose from "mongoose";

// City Master collection - each city belongs to one state,
// so the City dropdown can depend on the selected State.
const citySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
});

export default mongoose.model("City", citySchema);
