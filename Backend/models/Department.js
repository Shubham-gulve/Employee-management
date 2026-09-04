import mongoose from "mongoose";

// Department Master collection - feeds the typeahead dropdown.
const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
});

export default mongoose.model("Department", departmentSchema);
