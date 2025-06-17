import express from 'express'
import { createClient } from "@supabase/supabase-js";
import dotenv from '.env'
import cors from 'cors'

dotenv.config();
const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());