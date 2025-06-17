// import app from './src/app.js'
// import dotenv from 'dotenv'

// dotenv.config();
// const port = 4000;


// app.listen(port, ()=> {
//   console.log(`server is Running at port: ${port}`);
// })


import app from './src/app.js'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initializeSocket } from './socketService/index.js'

dotenv.config();
const port = 4000;


const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

initializeSocket(io);


server.listen(port, () => {
  console.log(`Server is running at port: ${port}`);
  console.log(`Socket.IO server initialized`);
});
