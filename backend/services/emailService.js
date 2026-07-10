import sendEmail from "./sendEmail.js";
const client = process.env.CLIENT_URL || "http://localhost:3000"
const mode = process.env.NODE_ENV;


export async function sendResetPassEmail(to,token) {
    const sub = "Reset Your OrbitPm Password";
    const url = `${client}/reset-password?token=${token}`;
    if(mode!=="production") {
        console.log(`${sub} (${to})`);
        console.log(url);
        return ;
    }
    const htmlContnt = `
        <div>
            <h1>${sub}</h1>
            <p>click here to RESET password: <a href=${url}>reset password</a></p>
            <p>If you don't reqested, you can safly ignore this</p>
            <a href=${url}>${url}</a>
        </div>
    `;
    await sendEmail(to,sub,htmlContnt);
}