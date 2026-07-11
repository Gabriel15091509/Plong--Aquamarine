// src/screens/Carnet/CarnetScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { plongees } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PlongeeCard from '../../components/cards/PlongeeCard';
import { Ionicons } from '@expo/vector-icons';

const CarnetScreen = () => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [plongeesList, setPlongeesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

      const validees = data.filter(p => p.valide_moniteur).length;
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

  if (loading) return <LoadingSpinner />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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

      {/* Liste */}
      <FlatList
        data={plongeesList}
        keyExtractor={(item) => item.id_plongee?.toString() || Math.random().toString()}
        renderItem={({ item }) => <PlongeeCard plongee={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="water-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Aucune plongée enregistrée
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              Votre carnet est vide pour le moment
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
    marginBottom: 8,
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