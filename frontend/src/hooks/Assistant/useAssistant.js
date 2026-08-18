import { useMutation } from "@tanstack/react-query";
import assistantService from "../../services/Assistant/assistantService";

// Pas de useQuery/cache ici : une conversation est un flux, pas une
// ressource à invalider/rafraîchir — l'historique vit dans le state du
// composant appelant (voir ChatAssistant.jsx).
export const useAssistant = () => {
  const useChat = () => {
    return useMutation({
      mutationFn: (messages) => assistantService.chat(messages),
    });
  };

  return { useChat };
};

export default useAssistant;
