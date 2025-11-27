const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Kodları saxlamaq üçün demo in-memory object
let codes = {};

// SMTP konfiqurasiya
const transporter = nodemailer.createTransport({
  host: "mail.verify-swift.com",  // Megahost SMTP host
  port: 465,                       // SSL: 465, TLS: 587
  secure: true,
  auth: {
    user: "check@verify-swift.com",   // sizin mailbox
    pass: "EMAIL_PASSWORD"            // SMTP şifrəniz
  }
});

// Kod göndərmə endpoint
app.post("/send-code", async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codes[email] = code;

  try {
    await transporter.sendMail({
      from: `"Verify-Swift" <check@verify-swift.com>`,
      to: email,
      subject: "Doğrulama kodunuz",
      text: `Sizin doğrulama kodunuz: ${code}`
    });
    res.send({ success: true, message: "Kod göndərildi" });
  } catch (err) {
    console.error("Mail göndərmə xətası", err);
    res.status(500).send({ success: false, message: "Mail göndərilə bilmədi" });
  }
});

// Kod yoxlama endpoint
app.post("/verify", (req, res) => {
  const { email, code } = req.body;
  if (codes[email] && codes[email] === code) {
    delete codes[email];
    return res.send({ success: true, message: "Email doğrulandı" });
  }
  res.status(400).send({ success: false, message: "Kod yanlış" });
});

app.listen(3000, () => console.log("Server 3000 portda işləyir"));
