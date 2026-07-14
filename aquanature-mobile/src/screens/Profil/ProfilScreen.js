// src/screens/Profil/ProfilScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { plongees, inscriptions, formations as formationsApi } from '../../api/endpoints';
import AppHeader from '../../components/common/AppHeader';
import { photoUrl } from '../../utils/photoUrl';
import { formatDate } from '../../utils/helpers';

// Reprend le degrade de l'en-tete de frontend/src/pages/ProfilePage.jsx
// (from-cyan-600 via-blue-600 to-indigo-600), distinct du degrade
// primary -> ocean utilise sur l'ecran de connexion.
const HERO_GRADIENT = ['#0891b2', '#2563eb', '#4338ca'];

const STAT_CARDS = [
  { key: 'totalPlongees', icon: 'boat', label: 'Plongées', gradient: ['#06b6d4', '#3b82f6'] },
  { key: 'sortiesAvenir', icon: 'calendar', label: 'Sorties à venir', gradient: ['#10b981', '#14b8a6'] },
  { key: 'formationsSuivies', icon: 'ribbon', label: 'Formations suivies', gradient: ['#a855f7', '#ec4899'] },
  { key: 'certifications', icon: 'checkmark-circle', label: 'Certifications', gradient: ['#f59e0b', '#f97316'] },
];

const ProfilScreen = () => {
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const navigation = useNavigation();

  const [plongeesList, setPlongeesList] = useState([]);
  const [sortiesAvenir, setSortiesAvenir] = useState(0);
  const [formationsCount, setFormationsCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user?.num_adherent) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);

    Promise.allSettled([
      plongees.getByAdherent(user.num_adherent),
      inscriptions.getMine(),
      formationsApi.getByAdherent(user.num_adherent),
    ]).then(([plongeesRes, inscriptionsRes, formationsRes]) => {
      if (plongeesRes.status === 'fulfilled') {
        setPlongeesList(plongeesRes.value.data.data || []);
      } else {
        console.log('Erreur chargement plongées (profil):', plongeesRes.reason?.message);
      }

      if (inscriptionsRes.status === 'fulfilled') {
        const mine = inscriptionsRes.value.data.data || [];
        const count = mine.filter(
          (i) =>
            i.statut === 'Confirmée' &&
            i.sortie?.date_heure &&
            new Date(i.sortie.date_heure) > new Date()
        ).length;
        setSortiesAvenir(count);
      } else {
        console.log('Erreur chargement inscriptions (profil):', inscriptionsRes.reason?.message);
      }

      if (formationsRes.status === 'fulfilled') {
        setFormationsCount((formationsRes.value.data.data || []).length);
      } else {
        console.log('Erreur chargement formations (profil):', formationsRes.reason?.message);
      }

      setStatsLoading(false);
    });
  }, [user?.num_adherent]);

  const stats = useMemo(
    () => ({
      totalPlongees: plongeesList.length,
      sortiesAvenir,
      formationsSuivies: formationsCount,
      certifications: user?.niveau ? 1 : 0,
    }),
    [plongeesList, sortiesAvenir, formationsCount, user?.niveau]
  );

  const anneesMembre = user?.date_inscription
    ? Math.max(new Date().getFullYear() - new Date(user.date_inscription).getFullYear(), 1)
    : 1;

  const recentDives = useMemo(
    () =>
      [...plongeesList]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3),
    [plongeesList]
  );

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppHeader />
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.notConnected, { color: colors.textSecondary }]}>
            Vous n'êtes pas connecté
          </Text>
        </View>
      </View>
    );
  }

  const fullName = `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
  const initial = (user.prenom || user.nom || user.email || 'A').charAt(0).toUpperCase();
  const photo = photoUrl(user.photo);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader />
      <ScrollView style={styles.scroll}>
      {/* En-tête */}
      <LinearGradient colors={HERO_GRADIENT} style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.avatarContainer}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
            <View style={styles.heroBadges}>
              <View style={styles.roleBadge}>
                <Ionicons name="person" size={12} color="#fff" />
                <Text style={styles.roleBadgeText}>{user.role || 'Adhérent'}</Text>
              </View>
            </View>
            <Text style={styles.heroSubtext}>
              Membre depuis {anneesMembre} an{anneesMembre > 1 ? 's' : ''} · {stats.totalPlongees} plongées
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Statistiques */}
      <View style={styles.statsGrid}>
        {STAT_CARDS.map((stat) => (
          <View key={stat.key} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <LinearGradient colors={stat.gradient} style={styles.statIcon}>
              <Ionicons name={stat.icon} size={22} color="#fff" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statsLoading ? '…' : stats[stat.key]}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Informations personnelles */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Informations personnelles
        </Text>

        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{user.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {user.telephone || 'Non renseigné'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Niveau : {user.niveau || 'Non défini'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {user.adresse || 'Adresse non renseignée'}
          </Text>
        </View>

        <View style={[styles.infoRow, styles.infoRowLast]}>
          <Ionicons name="heart-outline" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Contact urgence : {user.contact_urgence || 'Non renseigné'}
          </Text>
        </View>
      </View>

      {/* Dernières plongées */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Dernières plongées
        </Text>
        {statsLoading ? (
          <Text style={[styles.emptyDives, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
        ) : recentDives.length === 0 ? (
          <Text style={[styles.emptyDives, { color: colors.textSecondary }]}>
            Aucune plongée enregistrée
          </Text>
        ) : (
          recentDives.map((dive) => (
            <View
              key={dive.id_plongee}
              style={[styles.diveRow, { borderColor: colors.border }]}
            >
              <View style={styles.diveInfo}>
                <Text style={[styles.diveSite, { color: colors.text }]}>
                  {dive.site || dive.lieu || 'Site non renseigné'}
                </Text>
                <Text style={[styles.diveDate, { color: colors.textSecondary }]}>
                  {formatDate(dive.date)}
                </Text>
              </View>
              <Text style={[styles.diveDetail, { color: colors.primary }]}>
                {dive.profondeur_max ? `${dive.profondeur_max}m` : '—'}
              </Text>
              <Text style={[styles.diveDetail, { color: colors.textSecondary }]}>
                {dive.duree ? `${dive.duree}min` : '—'}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Mon activité */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Mon activité
        </Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Sorties', { screen: 'InscriptionsList' })}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Mes inscriptions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Préférences */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          Préférences
        </Text>

        <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
          <View style={styles.menuItemLeft}>
            <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.primary} />
            <Text style={[styles.menuItemText, { color: colors.text }]}>
              Thème {theme === 'dark' ? 'sombre' : 'clair'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.error }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textSecondary }]}>
        Aquanature Mobile v1.0.0
      </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 24,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  heroInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  heroBadges: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  heroSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    width: '47.5%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  emptyDives: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  diveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  diveInfo: {
    flex: 1,
  },
  diveSite: {
    fontSize: 14,
    fontWeight: '600',
  },
  diveDate: {
    fontSize: 12,
    marginTop: 2,
  },
  diveDetail: {
    fontSize: 13,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  notConnected: {
    textAlign: 'center',
    fontSize: 16,
    padding: 20,
  },
});

export default ProfilScreen;
