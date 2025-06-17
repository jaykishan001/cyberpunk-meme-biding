import app from './src/app.js'
import dotenv from 'dotenv'
import { createServer } from 'http';
import { Server } from 'socket.io';


dotenv.config();
const port = 4000;


app.listen(port, ()=> {
  console.log(`server is Running at port: ${port}`);
})



