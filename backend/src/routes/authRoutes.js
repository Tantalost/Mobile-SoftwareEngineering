import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../middleware/uploadMiddleware.js"; 
import {
    register, 
    login, 
    requestPasswordReset, 
    resetPassword,
    updateProfile
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/register", register);
router.post("/login", login);
router.post('/forgot-password-request', requestPasswordReset);
router.post('/reset-password', resetPassword);


router.put('/update-profile', 
    upload.single('avatar'), 
    uploadToCloudinary, 
    updateProfile
);

router.get("/profile", protect, (req, res) => {
    res.json(req.user);
});

export default router;