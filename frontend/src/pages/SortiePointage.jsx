import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUsers,
  FiBarChart2,
  FiArrowLeft,
} from "react-icons/fi";
import { useSorties } from "../hooks/useSorties";
import { useInscriptions } from "../hooks/useInscriptions";
import { useAuth } from "../context/AuthContext";
import PresenceCheck from "../components/Inscription/PresenceCheck";
import LoadingSpinner from "../components/Common/LoadingSpinner";

const SortiePointage = () => {
  const { id_sortie } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useGetById: useGetSortie } = useSorties();
  const { useGetAll, useUpdate } = useInscriptions();

  const { data: sortie, isLoading: loadingSortie } = useGetSortie(id_sortie);
  const {
    data: inscriptions,
    isLoading: loadingInscriptions,
    refetch,
  } = useGetAll();
  const updateInscription = useUpdate();

  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    notChecked: 0,
  });

  const sortieInscriptions = useMemo(() => {
    if (!inscriptions?.data) return [];
    return inscriptions.data.filter((i) => i.id_sortie === parseInt(id_sortie));
  }, [inscriptions, id_sortie]);

  useEffect(() => {
    const total = sortieInscriptions.length;
    const present = sortieInscriptions.filter(
      (i) => i.presence && i.presence_checked,
    ).length;
    const absent = sortieInscriptions.filter(
      (i) => !i.presence && i.presence_checked,
    ).length;
    const notChecked = sortieInscriptions.filter(
      (i) => !i.presence_checked,
    ).length;

    setStats({ total, present, absent, notChecked });
  }, [sortieInscriptions]);

  const filteredInscriptions = useMemo(() => {
    switch (filter) {
      case "present":
        return sortieInscriptions.filter(
          (i) => i.presence && i.presence_checked,
        );
      case "absent":
        return sortieInscriptions.filter(
          (i) => !i.presence && i.presence_checked,
        );
      case "not-checked":
        return sortieInscriptions.filter((i) => !i.presence_checked);
      default:
        return sortieInscriptions;
    }
  }, [sortieInscriptions, filter]);

  const handleCheck = async (id, data) => {
    setLoading(true);
    try {
      await updateInscription.mutateAsync({ id, data });
      await refetch();
      toast.success("Pointage mis à jour");
    } catch (error) {
      toast.error("Erreur lors du pointage");
    } finally {
      setLoading(false);
    }
  };

  if (loadingSortie || loadingInscriptions) return <LoadingSpinner />;

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* En-tête */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
              {sortie?.data?.type || "Pointage"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {sortie?.data?.lieu} • {sortie?.data?.site}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(sortie?.data?.date_sortie)}
            </p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {stats.total}
            </span>{" "}
            inscrits
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-800/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400 uppercase tracking-wider">
                Présents
              </p>
              <p className="text-2xl font-semibold text-green-700 dark:text-green-400 mt-1">
                {stats.present}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider">
                Absents
              </p>
              <p className="text-2xl font-semibold text-red-700 dark:text-red-400 mt-1">
                {stats.absent}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <FiXCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-yellow-200 dark:border-yellow-800/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                Non pointés
              </p>
              <p className="text-2xl font-semibold text-yellow-700 dark:text-yellow-400 mt-1">
                {stats.notChecked}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center">
              <FiClock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[
          { key: "all", label: `Tous (${stats.total})` },
          { key: "present", label: `Présents (${stats.present})` },
          { key: "absent", label: `Absents (${stats.absent})` },
          { key: "not-checked", label: `Non pointés (${stats.notChecked})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === item.key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Liste des inscriptions */}
      <div className="space-y-2">
        {filteredInscriptions.length === 0 ? (
          <div className="text-center py-12">
            <FiBarChart2 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              Aucune inscription dans cette catégorie
            </p>
          </div>
        ) : (
          filteredInscriptions.map((inscription) => (
            <PresenceCheck
              key={inscription.id_inscription}
              inscription={inscription}
              onCheck={handleCheck}
              loading={loading}
              onCancel={() =>
                handleCheck(inscription.id_inscription, {
                  presence_checked: false,
                  presence: false,
                  presence_check_time: null,
                })
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SortiePointage;