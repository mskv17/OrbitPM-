import { createClient } from "redis";
export let redisClient ;


export function connectRedis () {
    redisClient = createClient();
    redisClient.on("error",(err)=>console.log("Redis error :",err));
}