import sendEmail from "./sendEmail.js";
const client = process.env.CLIENT_URL || "http://localhost:4321";
const mode = process.env.NODE_ENV;


export async function sendResetPassEmail(to, token) {
    const sub = "Reset Your OrbitPm Password";
    const url = `${client}/reset-password?token=${encodeURIComponent(token)}`;
    if (mode !== "production") {
        console.log(`${sub} (${to})`);
        console.log(url);
        return;
    }
    const htmlContnt = `
        <div>
            <h1>${sub}</h1>
            <p>click here to RESET password: <a href=${url}>reset password</a></p>
            <p>If you don't reqested, you can safly ignore this</p>
            <a href=${url}>${url}</a>
        </div>
    `;
    await sendEmail(to, sub, htmlContnt);
}

export async function sendEmailVerification(to, token) {
    const sub = "Verify Your OrbitPM Email";
    const url = `${client}/verify-email?token=${encodeURIComponent(token)}`;

    if (mode !== "production") {
        console.log(`${sub} (${to})`);
        console.log(url);
        return;
    }

    const htmlContnt = `
        <div>
            <h1>${sub}</h1>
            <p>Please click here to verify your email:</p>
            <p><a href="${url}">Verify email</a></p>
            <p>If you did not create this account, you can safely ignore this email.</p>
            <a href="${url}">${url}</a>
        </div>
    `;

    await sendEmail(to, sub, htmlContnt);
}

export async function sendInvitationEmail(to, token) {
    const sub = "Organization Invitation - OrbitPM";
    const url = `${client}/accept-invitation?token=${encodeURIComponent(token)}`;

    if (mode !== "production") {
        console.log(`${sub} (${to})`);
        console.log(url);
        return;
    }

    const htmlContnt = `
        <div>
            <h1>${sub}</h1>
            <p>You have been invited to join an organization on OrbitPM.</p>
            <p>Please click here to accept your invitation:</p>
            <p><a href="${url}">Accept Invitation</a></p>
            <p>If you were not expecting this invitation, you can safely ignore this email.</p>
            <a href="${url}">${url}</a>
        </div>
    `;

    await sendEmail(to, sub, htmlContnt);
}