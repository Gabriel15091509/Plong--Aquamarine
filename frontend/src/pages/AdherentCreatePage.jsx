import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import AdherentForm from "../components/Adherent/AdherentForm";

const AdherentCreatePage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <AdherentForm editMode={false} />
    </motion.div>
  );
};

export default AdherentCreatePage;
