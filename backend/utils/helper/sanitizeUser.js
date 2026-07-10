export default function sanitizeUser (user) {
    const u = user.toObject?user.toObject():user;

    const remove = ["password","refreshToken","resetToken","resetTokenExpires","__v"];

    remove.forEach((r)=>delete u[r]);
    return u;
}

