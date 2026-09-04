import express from "express";
import { getDepartments, getStates, getCities } from "../controllers/masterController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/departments", getDepartments);
router.get("/states", getStates);
router.get("/cities", getCities);

export default router;
