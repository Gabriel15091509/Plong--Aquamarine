// src/screens/Carnet/CarnetScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { plongees } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import PlongeeCard from '../../components/cards/PlongeeCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../../components/common/AppHeader';

// Memes options que le <select> de frontend/src/components/Plongee/PlongeeList.jsx
const VALIDATION_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'valide', label: 'Validées' },
  { value: 'non_valide', label: 'Non validées' },
];

const CarnetScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [plongeesList, setPlongeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    validees: 0,
    profondeurMax: 0,
  });

  const loadPlongees = async () => {
    if (!user?.num_adherent) {
      setLoading(false);
      return;
    }

    try {
      const response = await plongees.getByAdherent(user.num_adherent);
      const data = response.data.data || [];
      setPlongeesList(data);

      const validees = data.filter(p => p.id_moniteur_validateur).length;
      const profondeurMax = Math.max(...data.map(p => p.profondeur_max || 0), 0);

      setStats({
        total: data.length,
        validees,
        profondeurMax,
      });
    } catch (error) {
      console.error('Erreur chargement plongées:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlongees();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlongees();
  };

  // Filtrage et recherche (meme logique que PlongeeList.jsx cote web)
  const filteredPlongees = useMemo(() => {
    let result = plongeesList;

    if (filter !== 'all') {
      result = result.filter((p) => {
        const isValide = !!p.id_moniteur_validateur;
        if (filter === 'valide') return isValide;
        if (filter === 'non_valide') return !isValide;
        return true;
      });
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.type_plongee?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [plongeesList, searchTerm, filter]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      {/* Statistiques */}
      <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Plongées</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.validees}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Validées</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.profondeurMax}m</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Max</Text>
        </View>
      </View>

      {/* Recherche */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Rechercher par type de plongée..."
        />
      </View>

      {/* Filtres (validation) */}
      <View style={styles.filterContainer}>
        {VALIDATION_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterButton,
              filter === f.value && {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => setFilter(f.value)}
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
      </View>

      {/* Liste */}
      <FlatList
        data={filteredPlongees}
        keyExtractor={(item) => item.id_plongee?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <PlongeeCard
            plongee={item}
            onPress={() =>
              navigation.navigate('PlongeeDetails', { plongeeId: item.id_plongee })
            }
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="water-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchTerm || filter !== 'all'
                ? 'Aucune plongée trouvée'
                : 'Aucune plongée enregistrée'}
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              {searchTerm || filter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Votre carnet est vide pour le moment'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
  },
  searchContainer: {
    marginHorizontal: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
  },
});

export default CarnetScreen;
