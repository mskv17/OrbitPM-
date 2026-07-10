import { createClient } from "redis";
import AppError from "../utils/AppError.js";
let redisClient = null ;


export async function connectRedis () {
    if(redisClient) return;
    redisClient = createClient();
    redisClient.on("error",(err)=>console.log("Redis error :",err));
    redisClient.on("connect",()=>console.log("Redis client connected successfully"))

    await redisClient.connect();
}

export function getRedisClient () {
    if(!redisClient) {
        throw new AppError("redis client not connected , call connectRedis")
    }
    return redisClient;
}