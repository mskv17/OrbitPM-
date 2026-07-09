export default function getCookieCred (MAX_AGE=7 * 24 * 60 * 60 * 1000) {
    return {
        httpOnly:true,
        secure:true,
        sameSite:'none',
        maxAge:MAX_AGE,
    }
}