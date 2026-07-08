import mongoose  from "mongoose"

export default function connectDB () {
    mongoose.connect(process.env.MONGO_URL)
    .then(console.log("DB Connected"))
    .catch ((err=>console.log("DB Conntection fiald: ",err)))
}