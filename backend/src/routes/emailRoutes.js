// backend/src/routes/emailRoutes.js
const express = require("express");
const router = express.Router();
const { sendWelcomeEmail } = require("../utils/email");

// 🔒 Flag pour bloquer les appels simultanés
let processing = false;

router.post("/send-welcome", async (req, res) => {
  console.log("📧 [ROUTE] /send-welcome");

  // 🔒 BLOQUER LES APPELS SIMULTANÉS
  if (processing) {
    console.log("⛔⛔ REQUÊTE DÉJÀ EN COURS - IGNORÉE");
    return res.status(429).json({
      success: false,
      message: "⛔ Une requête est déjà en cours",
    });
  }

  try {
    const { to, user, temporaryPassword, loginUrl } = req.body;

    console.log(`🔑 Mot de passe reçu: "${temporaryPassword}"`);

    // Validation
    if (!to) {
      return res
        .status(400)
        .json({ success: false, message: '❌ "to" est requis' });
    }
    if (!user?.name) {
      return res
        .status(400)
        .json({ success: false, message: '❌ "user.name" est requis' });
    }
    if (!temporaryPassword) {
      return res
        .status(400)
        .json({ success: false, message: '❌ "temporaryPassword" est requis' });
    }

    // 🔒 Verrouiller
    processing = true;

    // 🔑 Envoyer UN SEUL email avec le mot de passe reçu
    const result = await sendWelcomeEmail({
      to,
      user,
      temporaryPassword,
      loginUrl: loginUrl || "http://localhost:3000/login",
    });

    console.log(`✅ Email envoyé avec: "${temporaryPassword}"`);

    res.json({
      success: true,
      message: "✅ Email envoyé avec succès",
      data: {
        ...result,
        temporaryPassword: temporaryPassword,
      },
    });
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    res.status(500).json({
      success: false,
      message: "❌ " + error.message,
    });
  } finally {
    // 🔓 Déverrouiller après 5 secondes
    setTimeout(() => {
      processing = false;
      console.log("🔓 Route déverrouillée");
    }, 5000);
  }
});

module.exports = router;
