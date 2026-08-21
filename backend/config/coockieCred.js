export default function getCookieCred (MAX_AGE=7 * 24 * 60 * 60 * 1000) {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly:true,
        secure:isProduction,
        sameSite:isProduction ? "none" : "lax",
        maxAge:Number(MAX_AGE),
    }
}