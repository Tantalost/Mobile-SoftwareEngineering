import express from "express";
import { 
    register, 
    login, 
    requestPasswordReset, 
    resetPassword 
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/register", register);
router.post("/login", login);
router.post('/forgot-password-request', requestPasswordReset);
router.post('/reset-password', resetPassword);


router.get("/profile", protect, (req, res) => {
    res.json(req.user);
});

export default router;