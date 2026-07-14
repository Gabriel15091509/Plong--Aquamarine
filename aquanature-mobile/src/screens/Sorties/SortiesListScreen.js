// src/screens/Sorties/SortiesListScreen.js
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { sorties } from "../../api/endpoints";
import SearchBar from "../../components/common/SearchBar";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import StatusBadge from "../../components/common/StatusBadge";
import AppHeader from "../../components/common/AppHeader";
import { useTheme } from "../../context/ThemeContext";
import { formatDateTime } from "../../utils/helpers";

// Memes options que le <select> de frontend/src/components/Sortie/SortieList.jsx
const STATUT_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "Planifiée", label: "Planifiées" },
  { value: "En cours", label: "En cours" },
  { value: "Terminée", label: "Terminées" },
  { value: "Annulée", label: "Annulées" },
];

const SortiesListScreen = () => {
  const [sortiesList, setSortiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigation = useNavigation();
  const { colors } = useTheme();

  const loadSorties = async () => {
    try {
      const response = await sorties.getAll();
      setSortiesList(response.data.data || []);
    } catch (error) {
      console.error("Erreur chargement sorties:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSorties();
    setRefreshing(false);
  };

  useEffect(() => {
    loadSorties();
  }, []);

  // Filtrage et recherche (meme logique que SortieList.jsx cote web)
  const filteredSorties = useMemo(() => {
    let result = sortiesList;

    if (filter !== "all") {
      result = result.filter((s) => s.statut === filter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.lieu?.toLowerCase().includes(search) ||
          s.type?.toLowerCase().includes(search) ||
          s.site?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [sortiesList, searchTerm, filter]);

  // Pagination
  const totalPages = Math.ceil(filteredSorties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSorties = filteredSorties.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleInscription = (sortieId) => {
    navigation.navigate("Inscription", { sortieId });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppHeader />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppHeader />
      <View style={styles.container}>
      {/* Barre de recherche + acces aux inscriptions (comme le lien
          "Inscriptions" du menu web) */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Rechercher par lieu, site, type..."
          />
        </View>
        <TouchableOpacity
          style={[styles.myInscriptionsButton, { backgroundColor: colors.primary + '20' }]}
          onPress={() => navigation.navigate('InscriptionsList')}
        >
          <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filtres horizontaux (statut, comme le select web) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterContainer}
      >
        {STATUT_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterButton,
              filter === f.value && {
                backgroundColor: colors.primary + "20",
                borderColor: colors.primary,
              },
            ]}
            onPress={() => {
              setFilter(f.value);
              setCurrentPage(1);
            }}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f.value ? colors.primary : colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des sorties */}
      <FlatList
        data={paginatedSorties}
        keyExtractor={(item) => (item.id_sortie || item.id).toString()}
        renderItem={({ item }) => {
          const sortieId = item.id_sortie || item.id;
          const isPastSortie = new Date(item.date_heure) < new Date();
          const isFull = (item.nb_places || 0) <= (item.nb_inscrits || 0);
          // Meme contrainte que le backend (InscriptionService.createInscription) :
          // seule une sortie encore "Planifiée" accepte des inscriptions.
          const isNotPlanifiee = (item.statut || "Planifiée") !== "Planifiée";

          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* En-tête avec icône */}
              <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.primary + "20" },
                    ]}
                  >
                    <Ionicons name="boat" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.typeText, { color: colors.textSecondary }]}>
                    {item.type || "Sortie"}
                  </Text>
                </View>

                <StatusBadge status={item.statut || "Planifiée"} />
              </View>

              {/* Lieu */}
              <Text style={[styles.lieu, { color: colors.text }]}>
                {item.lieu || "Lieu non défini"}
              </Text>
              {item.site && (
                <Text style={[styles.site, { color: colors.textSecondary }]}>
                  {item.site}
                </Text>
              )}

              {/* Détails */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    {formatDateTime(item.date_heure)}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="people-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    {item.nb_inscrits || 0}/{item.nb_places || 0}
                  </Text>
                  {isFull && (
                    <Text style={[styles.completText, { color: colors.error }]}>
                      (Complet)
                    </Text>
                  )}
                </View>
                <View style={styles.detailItem}>
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    Niveau {item.niveau_requis || "Tous niveaux"}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="water-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.detailText, { color: colors.textSecondary }]}
                  >
                    {item.profondeur_max}m
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {!isPastSortie && !isFull && !isNotPlanifiee && (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.success + "20" },
                    ]}
                    onPress={() => handleInscription(sortieId)}
                  >
                    <Ionicons
                      name="person-add-outline"
                      size={18}
                      color={colors.success}
                    />
                    <Text
                      style={[styles.actionText, { color: colors.success }]}
                    >
                      S'inscrire
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.primary + "20" },
                  ]}
                  onPress={() =>
                    navigation.navigate("SortieDetails", { sortieId })
                  }
                >
                  <Ionicons
                    name="eye-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={[styles.actionText, { color: colors.primary }]}>
                    Voir
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="boat-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchTerm || filter !== "all"
                ? "Aucune sortie trouvée"
                : "Aucune sortie disponible"}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {searchTerm || filter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Revenez plus tard pour voir les nouvelles sorties"}
            </Text>
          </View>
        }
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <View
          style={[
            styles.paginationContainer,
            { borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationDisabled,
            ]}
            onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <Text
              style={[styles.paginationText, { color: colors.textSecondary }]}
            >
              Précédent
            </Text>
          </TouchableOpacity>
          <Text style={[styles.paginationPage, { color: colors.text }]}>
            {currentPage} / {totalPages}
          </Text>
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationDisabled,
            ]}
            onPress={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <Text
              style={[styles.paginationText, { color: colors.textSecondary }]}
            >
              Suivant
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
  },
  myInscriptionsButton: {
    width: 46,
    height: 46,
    marginBottom: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScrollContainer: {
    flexGrow: 0,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 2,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  lieu: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  site: {
    fontSize: 14,
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
  },
  completText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationDisabled: {
    opacity: 0.4,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "500",
  },
  paginationPage: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SortiesListScreen;
