import axios from "axios";

export default async function sendEmail(email, sub, htmlContent) {
  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Orbit PM",
          email: "mskvdeveloper@gmail.com",
        },
        to: [{ email }],
        subject: sub,
        htmlContent,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if(res.status === 201) {
        return true;
    }

  } catch (err) {
    console.error("Brivo email error: ", err.message || err.response?.data);
    return false;
  }
}
