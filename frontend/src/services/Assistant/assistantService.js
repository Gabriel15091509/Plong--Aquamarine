import api from "../api";

class AssistantService {
  async chat(messages) {
    const response = await api.post("/assistant/chat", { messages });
    return response.data;
  }
}

export default new AssistantService();
