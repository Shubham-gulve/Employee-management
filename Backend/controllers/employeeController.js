import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import Employee from "../models/Employee.js";

const FIELDS = [
  "name",
  "email",
  "phone",
  "gender",
  "department",
  "state",
  "city",
  "pincode",
  "address",
  "isPermanent",
];

// Pull only the known fields off the request body.
const pickFields = (body) => {
  const data = {};
  FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  // Multipart form data arrives as strings, so normalise the checkbox.
  if (data.isPermanent !== undefined) {
    data.isPermanent = data.isPermanent === "true" || data.isPermanent === true;
  }
  return data;
};

// User input goes into a regex, so the special characters have to be neutralised.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// An upload that is no longer referenced is dead weight on disk.
const removeUpload = async (storedPath) => {
  if (!storedPath) return;
  try {
    await fs.unlink(path.join("uploads", path.basename(storedPath)));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Could not remove upload:", error.message);
  }
};

// A rejected request must not leave the just-uploaded file behind.
const discardUpload = (req) => removeUpload(req.file && `/uploads/${req.file.filename}`);

export const createEmployee = async (req, res, next) => {
  try {
    const data = pickFields(req.body);

    const existingEmployee = await Employee.findOne({ email: data.email });
    if (existingEmployee) {
      await discardUpload(req);
      return res.status(400).json({ message: "Employee already exists with this email" });
    }

    if (req.file) data.profilePicture = `/uploads/${req.file.filename}`;

    const newEmployee = await Employee.create(data);
    res.status(201).json({ message: "Employee created successfully", data: newEmployee });
  } catch (error) {
    await discardUpload(req);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const getEmployees = async (req, res, next) => {
  try {
    const { search } = req.query;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);

    const filter = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: "i" } },
            { email: { $regex: escapeRegex(search), $options: "i" } },
          ],
        }
      : {};

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate("department")
        .populate("state")
        .populate("city")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(filter),
    ]);

    res.status(200).json({
      data: employees,
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = await Employee.findById(req.params.id)
      .populate("department")
      .populate("state")
      .populate("city");

    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      await discardUpload(req);
      return res.status(404).json({ message: "Employee not found" });
    }

    const data = pickFields(req.body);
    const current = await Employee.findById(req.params.id);

    if (!current) {
      await discardUpload(req);
      return res.status(404).json({ message: "Employee not found" });
    }

    // Keep the email unique across other records.
    if (data.email) {
      const duplicate = await Employee.findOne({
        email: data.email,
        _id: { $ne: req.params.id },
      });
      if (duplicate) {
        await discardUpload(req);
        return res.status(400).json({ message: "Another employee already uses this email" });
      }
    }

    if (req.file) data.profilePicture = `/uploads/${req.file.filename}`;

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    })
      .populate("department")
      .populate("state")
      .populate("city");

    // The replaced picture is only dropped once the update actually went through.
    if (req.file) await removeUpload(current.profilePicture);

    res.status(200).json({ message: "Employee updated successfully", data: updatedEmployee });
  } catch (error) {
    await discardUpload(req);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) return res.status(404).json({ message: "Employee not found" });

    await removeUpload(deletedEmployee.profilePicture);
    res.status(200).json({ message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};
