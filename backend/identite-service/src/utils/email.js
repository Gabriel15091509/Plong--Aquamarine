// Version identite-service de utils/email.js : ne garde que l'email de
// bienvenue (création de compte) — les autres gabarits (paiement, alerte,
// inscription...) vivent dans le service propriétaire du domaine concerné.
const nodemailer = require("nodemailer");
const path = require("path");

const emailCache = new Map();
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const LOGO_CID = "logo-aquanature";

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("Variables email non configurées");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true" || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async (params = {}) => {
  const { to, subject, html, text, from } = params;

  const cacheKey = `${to}-${subject}`;
  if (emailCache.has(cacheKey)) {
    console.log(`EMAIL DÉJÀ ENVOYÉ À ${to} - IGNORÉ !`);
    return {
      success: true,
      messageId: `blocked-${Date.now()}`,
      to,
      subject,
      blocked: true,
    };
  }

  if (!to) throw new Error("Destinataire requis");
  if (!subject) throw new Error("Sujet requis");
  if (!html) throw new Error("Contenu HTML requis");

  emailCache.set(cacheKey, Date.now());

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("[SIMULATION] Email envoyé à", to);
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
      to,
      subject,
      simulated: true,
    };
  }

  // L'envoi réel (verify() + sendMail()) fait un aller-retour réseau vers le
  // serveur SMTP, potentiellement long (plusieurs secondes) : on ne le fait
  // plus attendre par l'appelant (qui doit répondre vite à l'interface) —
  // exécuté en arrière-plan, erreurs journalisées ici plutôt que remontées.
  (async () => {
    try {
      const transporter = createTransporter();
      if (!transporter) throw new Error("Transporteur non configuré");
      await transporter.verify();

      const mailOptions = {
        from:
          from ||
          process.env.EMAIL_FROM ||
          "Club de Plongée <no-reply@club-plongee.fr>",
        to,
        subject,
        html,
        text:
          text ||
          html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        attachments: [
          { filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID },
        ],
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Erreur envoi:", error.message);
      emailCache.delete(cacheKey);
    }
  })();

  return { success: true, messageId: `queued-${Date.now()}`, to, subject, queued: true };
};

const sendWelcomeEmail = async ({ to, user, temporaryPassword, loginUrl }) => {
  const name = user?.name || "Utilisateur";
  const email = user?.email || to;
  const role = user?.role || "adhérent";
  const loginLink = loginUrl || "http://localhost:3000/login";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue — Aquanature Plongée</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #eef1f4; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 12px 32px rgba(15,23,42,0.07); overflow: hidden; }
    .header { background: #0b3552; padding: 36px 40px 32px; text-align: center; border-bottom: 3px solid #c9a227; }
    .header .logo-badge { display: inline-block; width: 72px; height: 72px; border-radius: 50%; background: #ffffff; padding: 4px; margin-bottom: 14px; }
    .header .logo-badge img { display: block; width: 100%; height: 100%; border-radius: 50%; }
    .header .brand { color: #ffffff; font-size: 17px; font-weight: 700; letter-spacing: 0.5px; }
    .header .tagline { color: rgba(255,255,255,0.6); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
    .content { padding: 40px; }
    .eyebrow { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9a7817; background: #fdf6e3; padding: 4px 10px; border-radius: 4px; margin-bottom: 16px; }
    .greeting { font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #0b3552; }
    .sub-greeting { color: #6b7280; font-size: 15px; margin-bottom: 24px; }
    .info-card { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 12px 0; border-left: 3px solid #0b3552; }
    .info-card .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
    .info-card .value { font-size: 16px; font-weight: 600; color: #1f2937; margin-top: 4px; }
    .password-box { background: #fdf6e3; border-radius: 10px; padding: 24px; margin: 20px 0; border: 1px solid #e8d38f; text-align: center; }
    .password-box .lbl { font-size: 13px; color: #7a5e10; font-weight: 600; }
    .password-box .pwd { font-family: 'Courier New', monospace; font-size: 26px; font-weight: 800; color: #4a3a09; letter-spacing: 3px; background: #ffffff; padding: 10px 24px; border-radius: 8px; display: inline-block; margin-top: 10px; border: 1px solid #e8d38f; }
    .warning { background: #fef2f2; border-radius: 10px; padding: 16px; margin: 20px 0; border-left: 3px solid #dc2626; }
    .warning p { color: #991b1b; font-size: 14px; }
    .btn { display: inline-block; padding: 13px 40px; background: #0b3552; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }
    .footer { padding: 22px 40px; border-top: 1px solid #eef1f4; text-align: center; }
    .footer .club { color: #64748b; font-weight: 600; margin-bottom: 2px; font-size: 13px; }
    .footer p { color: #94a3b8; font-size: 12px; }
    @media (max-width: 480px) {
      .header { padding: 28px 24px; }
      .content { padding: 24px 20px; }
      .password-box .pwd { font-size: 19px; letter-spacing: 2px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge"><img src="cid:${LOGO_CID}" width="64" height="64" alt="Aquanature Plongée" /></div>
      <div class="brand">AQUANATURE PLONGÉE</div>
      <div class="tagline">Club de plongée · Saint-Leu · La Réunion</div>
    </div>
    <div class="content">
      <span class="eyebrow">Nouveau membre</span>
      <div class="greeting">Bonjour ${name},</div>
      <p class="sub-greeting">Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>

      <div class="info-card">
        <div class="label">Email de connexion</div>
        <div class="value">${email}</div>
      </div>

      <div class="info-card">
        <div class="label">Rôle</div>
        <div class="value">${role}</div>
      </div>

      <div class="password-box">
        <div class="lbl">Mot de passe temporaire</div>
        <div class="pwd">${temporaryPassword}</div>
      </div>

      <div class="warning">
        <p><strong>Important :</strong> changez votre mot de passe lors de votre première connexion.</p>
      </div>

      <div style="text-align:center;margin:28px 0 4px;">
        <a href="${loginLink}" class="btn">Se connecter</a>
      </div>
    </div>
    <div class="footer">
      <p class="club">Aquanature Plongée</p>
      <p>© ${new Date().getFullYear()} — email automatique, ne pas répondre</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
Bonjour ${name},

Bienvenue au Club de Plongée ! Votre compte a été créé avec succès.

Email: ${email}
Rôle: ${role}
Mot de passe temporaire: ${temporaryPassword}

Important: Changez votre mot de passe à la première connexion.

Connectez-vous: ${loginLink}

À bientôt !
  `;

  const result = await sendEmail({
    to,
    subject: "Bienvenue au Club de Plongée !",
    html: htmlContent,
    text: textContent,
  });

  return {
    ...result,
    temporaryPassword: temporaryPassword,
  };
};

// Communication ciblée (CDC 3.6.1) : message libre du président vers un
// segment d'adhérents (niveau/ancienneté), pas de gabarit riche comme
// sendWelcomeEmail — le contenu vient du formulaire.
const sendCommunicationEmail = async ({ to, adherentName, subject, message }) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject} — Aquanature Plongée</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #eef1f4; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1f2937; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 10px 30px rgba(15,23,42,0.06); overflow: hidden; }
    .header { background: #0b3552; padding: 28px 40px; text-align: center; border-bottom: 3px solid #c9a227; }
    .header .logo-badge { display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: #ffffff; padding: 4px; margin-bottom: 12px; }
    .header .logo-badge img { display: block; width: 100%; height: 100%; border-radius: 50%; }
    .header .brand { color: #ffffff; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
    .header .tagline { color: rgba(255,255,255,0.6); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px; }
    .eyebrow { padding: 24px 40px 0; }
    .eyebrow span { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9a7817; background: #fdf6e3; padding: 4px 10px; border-radius: 4px; }
    .content { padding: 14px 40px 32px; }
    .content p { margin-bottom: 12px; color: #374151; font-size: 15px; }
    .content .message { white-space: pre-wrap; }
    .footer { padding: 20px 40px; border-top: 1px solid #eef1f4; text-align: center; }
    .footer .club { color: #64748b; font-weight: 600; margin-bottom: 2px; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge"><img src="cid:${LOGO_CID}" width="56" height="56" alt="Aquanature Plongée" /></div>
      <div class="brand">AQUANATURE PLONGÉE</div>
      <div class="tagline">Club de plongée · Saint-Leu · La Réunion</div>
    </div>
    <div class="eyebrow"><span>Message du club</span></div>
    <div class="content"><p>Bonjour ${adherentName},</p><p class="message">${message}</p></div>
    <div class="footer">
      <p class="club">Aquanature Plongée</p>
      <p>© ${new Date().getFullYear()} — email envoyé par le club</p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({ to, subject, html: htmlContent });
};

// Code de connexion à usage unique (2FA président, exigence 4.4). Le sujet
// inclut l'horodatage : sendEmail() bloque tout renvoi identique to+subject
// (cache anti-doublon jamais vidé pour ce couple), et un président qui
// retente sa connexion doit recevoir un nouveau code à chaque fois.
const sendOtpEmail = async ({ to, name, code }) => {
  const now = new Date().toLocaleString("fr-FR");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code de connexion — Aquanature Plongée</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #eef1f4; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1f2937; }
    .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 10px 30px rgba(15,23,42,0.06); overflow: hidden; }
    .header { background: #0b3552; padding: 28px 40px; text-align: center; border-bottom: 3px solid #c9a227; }
    .header .logo-badge { display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #ffffff; padding: 4px; margin-bottom: 10px; }
    .header .logo-badge img { display: block; width: 100%; height: 100%; border-radius: 50%; }
    .header .brand { color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 32px 40px; text-align: center; }
    .eyebrow { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9a7817; background: #fdf6e3; padding: 4px 10px; border-radius: 4px; margin-bottom: 14px; }
    .content p { color: #374151; font-size: 15px; }
    .code { font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0b3552; background: #f8fafc; border: 1px solid #dbe4ee; border-radius: 10px; padding: 16px 24px; display: inline-block; margin: 18px 0; }
    .meta { color: #94a3b8; font-size: 13px; }
    .warning { background: #fef2f2; border-radius: 10px; padding: 14px 16px; margin-top: 18px; border-left: 3px solid #dc2626; text-align: left; }
    .warning p { color: #991b1b; font-size: 13px; }
    .footer { padding: 20px 40px; border-top: 1px solid #eef1f4; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge"><img src="cid:${LOGO_CID}" width="48" height="48" alt="Aquanature Plongée" /></div>
      <div class="brand">AQUANATURE PLONGÉE</div>
    </div>
    <div class="content">
      <span class="eyebrow">Code de connexion</span>
      <p>Bonjour ${name},</p>
      <p style="margin-top:8px;">Voici votre code à usage unique pour finaliser votre connexion :</p>
      <div class="code">${code}</div>
      <p class="meta">Valable 5 minutes — demandé le ${now}</p>
      <div class="warning">
        <p>Si vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe immédiatement.</p>
      </div>
    </div>
    <div class="footer"><p>© ${new Date().getFullYear()} Aquanature Plongée — email automatique, ne pas répondre</p></div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `Code de connexion — ${now}`,
    html: htmlContent,
    text: `Bonjour ${name},\n\nVotre code de connexion : ${code}\nValable 5 minutes.\n\nSi vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe immédiatement.`,
  });
};

// Mot de passe oublié : lien à usage unique (voir AuthController.forgotPassword),
// même gabarit visuel que sendOtpEmail (bandeau + carte centrale) mais avec un
// bouton plutôt qu'un code, puisque le jeton n'est pas destiné à être ressaisi
// à la main.
const sendPasswordResetEmail = async ({ to, name, resetUrl, validityMinutes = 60 }) => {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation du mot de passe — Aquanature Plongée</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #eef1f4; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1f2937; }
    .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 10px 30px rgba(15,23,42,0.06); overflow: hidden; }
    .header { background: #0b3552; padding: 28px 40px; text-align: center; border-bottom: 3px solid #c9a227; }
    .header .logo-badge { display: inline-block; width: 56px; height: 56px; border-radius: 50%; background: #ffffff; padding: 4px; margin-bottom: 10px; }
    .header .logo-badge img { display: block; width: 100%; height: 100%; border-radius: 50%; }
    .header .brand { color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
    .content { padding: 32px 40px; text-align: center; }
    .eyebrow { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9a7817; background: #fdf6e3; padding: 4px 10px; border-radius: 4px; margin-bottom: 14px; }
    .content p { color: #374151; font-size: 15px; }
    .btn { display: inline-block; margin: 22px 0 6px; padding: 13px 36px; background: #0b3552; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }
    .fallback { color: #94a3b8; font-size: 12px; word-break: break-all; margin-top: 4px; }
    .meta { color: #94a3b8; font-size: 13px; margin-top: 16px; }
    .warning { background: #fef2f2; border-radius: 10px; padding: 14px 16px; margin-top: 18px; border-left: 3px solid #dc2626; text-align: left; }
    .warning p { color: #991b1b; font-size: 13px; }
    .footer { padding: 20px 40px; border-top: 1px solid #eef1f4; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge"><img src="cid:${LOGO_CID}" width="48" height="48" alt="Aquanature Plongée" /></div>
      <div class="brand">AQUANATURE PLONGÉE</div>
    </div>
    <div class="content">
      <span class="eyebrow">Mot de passe oublié</span>
      <p>Bonjour ${name},</p>
      <p style="margin-top:8px;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      <a href="${resetUrl}" class="btn">Réinitialiser mon mot de passe</a>
      <p class="fallback">Ou copiez ce lien dans votre navigateur : ${resetUrl}</p>
      <p class="meta">Valable ${validityMinutes} minutes</p>
      <div class="warning">
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : votre mot de passe actuel reste inchangé.</p>
      </div>
    </div>
    <div class="footer"><p>© ${new Date().getFullYear()} Aquanature Plongée — email automatique, ne pas répondre</p></div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe",
    html: htmlContent,
    text: `Bonjour ${name},\n\nPour choisir un nouveau mot de passe, ouvrez ce lien : ${resetUrl}\nValable ${validityMinutes} minutes.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe actuel reste inchangé.`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendCommunicationEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
};
