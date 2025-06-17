import express from 'express'
import { changePassword, getProfile, login, logout, signup, updateProfile } from '../controller/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = express.Router();;

router.post('/register', signup);
router.post('/login', login);
router.post('/logout',verifyJWT, logout);
router.get('/profile',verifyJWT, getProfile);
router.put('/profile',verifyJWT, updateProfile);
router.put('/change-password', verifyJWT, changePassword);

export default router;