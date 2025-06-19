import express from "express";
import { ApiResponse } from "./utils/api-response.js";
import cors from 'cors'

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://your-frontend-url.vercel.app',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.get("/", (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "Everything working fine"));
});

import userRouter from '../src/routes/user.route.js'
import healthCheck from '../src/routes/healthCheck.route.js'
import memeRoute from '../src/routes/meme.route.js'
import auctionRoute from '../src/routes/auction.route.js'

app.use('/api/v1/user', userRouter );
app.use('/api/v1/health-check', healthCheck)
app.use('/api/v1/meme', memeRoute)
app.use('/api/v1/auction', auctionRoute );

export default app;
