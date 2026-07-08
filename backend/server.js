import { configDotenv } from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDb.js";
configDotenv();
const PORT = process.env.PORT;

function startServer() {
    connectDB();
    app.listen(PORT,()=>console.log(`server running on PORT: ${PORT}`))
}

startServer();