import React from "react";
import { motion } from "framer-motion";
import {
  FiFileText,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import CertificatList from "../components/CertificatMedical/CertificatList";

const CertificatsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            Certificats Médicaux
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gestion des certificats médicaux des adhérents
          </p>
        </div>
      </div>

      <CertificatList />
    </motion.div>
  );
};

export default CertificatsPage;
