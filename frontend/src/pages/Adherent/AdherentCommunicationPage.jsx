import React from "react";
import { motion } from "framer-motion";
import CommunicationForm from "../../components/Adherent/CommunicationForm";

const AdherentCommunicationPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <CommunicationForm />
    </motion.div>
  );
};

export default AdherentCommunicationPage;
