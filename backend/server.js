import { configDotenv } from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDb.js";
import { connectRedis } from "./config/reddis.js";
import {protector} from "protector-shield";


configDotenv();
const PORT = process.env.PORT;

async function startServer() {
    connectDB();
    await connectRedis();
    console.log("Frontend URL:", process.env.FRONTEND_URL);
    app.listen(PORT,()=>{
        console.log(`server running on PORT: ${PORT} `)
        if(process.env.NODE_ENV!=="production") {
            console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           🚀 ORBITPM DEVELOPMENT                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Don't just build features. Understand them.                               ║
║                                                                            ║
║  Every feature should teach you:                                           ║
║                                                                            ║
║      ❓ One new "WHY"                                                      ║
║           not just                                                        ║
║      ⚙️  One new "HOW"                                                     ║
║                                                                            ║
║  Ask yourself after every implementation:                                  ║
║                                                                            ║
║   • Why did I build it this way?                                           ║
║   • What alternatives exist?                                               ║
║   • Why didn't I choose them?                                              ║
║   • What trade-offs did I accept?                                          ║
║   • How would this scale to 100,000 users?                                 ║
║                                                                            ║
║  Engineers don't memorize answers.                                         ║
║  Engineers understand decisions.                                           ║
║                                                                            ║
║                  Build. Question. Understand. Repeat.                      ║
║                                                                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
        }
    })
}

protector(startServer);