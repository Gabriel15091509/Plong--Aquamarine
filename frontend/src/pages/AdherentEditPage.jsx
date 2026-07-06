import React from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import AdherentForm from "../components/Adherent/AdherentForm";

const AdherentEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
   
      <AdherentForm editMode={true} adherentId={id} />
    </motion.div>
  );
};

export default AdherentEditPage;
