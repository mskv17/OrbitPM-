import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors"
import helmet from "helmet";
import compression from "compression"
import authRoutes from "./routes/authRoutes.js";
const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors());

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