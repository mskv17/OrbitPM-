import { configDotenv } from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDb.js";
import { connectRedis } from "./config/reddis.js";
configDotenv();
const PORT = process.env.PORT;

function startServer() {
    connectDB();
    connectRedis();
    app.listen(PORT,()=>console.log(`server running on PORT: ${PORT}`))
}

startServer();