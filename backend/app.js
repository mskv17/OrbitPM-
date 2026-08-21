import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression"
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import { configDotenv } from "dotenv";

configDotenv();
const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:4321",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.get("/api/status",(req,res) => {
    res.json({
        status:"ok"
    })
});

app.use("/api/auth",authRoutes);

app.get("{*splat}",(req,res) => {
    res.status(404).send("404 Page not found");
});

app.use((err,req,res,next) => {
    if(!err.statusCode) {
        console.error(err);
    }
    res.status(err.statusCode||500).json({
        success:false,
        message:err.statusCode?err.message:"Internal Server Error"
    });
});

export default app;