import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    profilePicture: { type: String, default: null },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      required: true,
      match: [/^\d{10}$/, "Phone number must be exactly 10 digits"],
    },
    gender: { type: String, required: true, enum: ["M", "F", "Other"] },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Pincode must be exactly 6 digits"],
    },
    address: { type: String, required: true, trim: true },
    isPermanent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
