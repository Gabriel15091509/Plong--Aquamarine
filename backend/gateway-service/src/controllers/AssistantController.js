const AssistantService = require("../services/AssistantService");
const { withStatus } = require("../utils/errors");

class AssistantController {
  constructor() {
    this.assistantService = new AssistantService();
  }

  async chat(req, res, next) {
    try {
      const { messages } = req.body;
      const { reply, source } = await this.assistantService.chat(req.user, messages);
      res.json({ success: true, data: { reply, source } });
    } catch (error) {
      next(withStatus(error, 500));
    }
  }
}

module.exports = AssistantController;
