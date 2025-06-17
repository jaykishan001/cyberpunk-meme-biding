import express from 'express'
import { getProfile, login, signup } from '../controller/user.controller.js';
import { healthCheck } from '../controller/healthCheck.controller.js';

const router = express.Router();;

router.get('/', healthCheck);
// router.get('/profile',"middlewar", getProfile)

export default router;