import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors"
const app = express();

app.use(morgan("dev"));
app.use(express.json());
// app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors());

app.get("/status",(req,res) => {
    res.json({
        status:"ok"
    })
})

app.get("{*splat}",(req,res) => {
    res.status(404).send("404 Page not found");
})

export default app;