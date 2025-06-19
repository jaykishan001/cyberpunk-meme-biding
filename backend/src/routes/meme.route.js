import express from 'express';
import { getMemes, uploadMeme, voteOnMeme , getUserMemes, getLeaderboardMemes } from '../controller/meme.controller.js';
import { upload } from '../middleware/multer.js';
import {verifyJWT} from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/upload', verifyJWT, upload.single('image'), uploadMeme);
router.get('/all', getMemes);
router.post('/:memeId/vote', verifyJWT, voteOnMeme);
router.get('/user-memes', verifyJWT, getUserMemes);
router.get('/leaderboard', getLeaderboardMemes);

export default router;
