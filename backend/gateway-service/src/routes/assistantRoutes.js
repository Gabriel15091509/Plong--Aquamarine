const express = require("express");
const router = express.Router();
const AssistantController = require("../controllers/AssistantController");
const AuthMiddleware = require("../middlewares/authMiddleware");

const assistantController = new AssistantController();

router.post(
  "/chat",
  AuthMiddleware.authenticate,
  assistantController.chat.bind(assistantController),
);

module.exports = router;
