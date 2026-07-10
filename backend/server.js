import { configDotenv } from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDb.js";
import { connectRedis } from "./config/reddis.js";
configDotenv();
const PORT = process.env.PORT;

async function startServer() {
    connectDB();
    await connectRedis();
    app.listen(PORT,()=>console.log(`server running on PORT: ${PORT}`))
}

startServer();