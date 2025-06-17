import express from "express";
import { ApiResponse } from "./utils/api-response.js";
import cors from 'cors'

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json(new ApiResponse(200, null, "Everything working fine"));
});


import userRouter from '../src/routes/user.route.js'
import healthCheck from '../src/routes/healthCheck.route.js'
app.use('/api/v1/user', userRouter );
app.use('/api/v1/health-check', healthCheck)




export default app;
