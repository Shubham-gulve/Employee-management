import mongoose from "mongoose";
import Department from "../models/Department.js";
import State from "../models/State.js";
import City from "../models/City.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Typeahead: /api/masters/departments?search=fin
export const getDepartments = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = search ? { name: { $regex: escapeRegex(search), $options: "i" } } : {};
    const departments = await Department.find(filter).sort({ name: 1 }).limit(20);
    res.status(200).json({ data: departments });
  } catch (error) {
    next(error);
  }
};

export const getStates = async (req, res, next) => {
  try {
    const states = await State.find().sort({ name: 1 });
    res.status(200).json({ data: states });
  } catch (error) {
    next(error);
  }
};

// Cities are filtered by the selected state: /api/masters/cities?stateId=...
export const getCities = async (req, res, next) => {
  try {
    const { stateId } = req.query;
    if (!mongoose.isValidObjectId(stateId)) {
      return res.status(400).json({ message: "A valid stateId is required" });
    }
    const cities = await City.find({ state: stateId }).sort({ name: 1 });
    res.status(200).json({ data: cities });
  } catch (error) {
    next(error);
  }
};
