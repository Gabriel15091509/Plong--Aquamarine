// src/components/common/AppHeader.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { alertes } from '../../api/endpoints';
import { photoUrl } from '../../utils/photoUrl';
import { formatRelativeTime } from '../../utils/helpers';

// Meme table que getAlertIcon/getAlertDescription de
// frontend/src/components/Layout/Header.jsx, adaptee aux icones Ionicons.
const ALERT_META = {
  'Certificat expiré': { icon: 'alert-circle', color: '#ef4444', description: 'Le certificat médical a expiré' },
  'Certificat expire bientot': { icon: 'calendar', color: '#f59e0b', description: 'Le certificat médical expire dans moins de 30 jours' },
  'Adhésion expirée': { icon: 'alert-circle', color: '#f97316', description: "L'adhésion est arrivée à expiration" },
  'Adhesion expire bientot': { icon: 'calendar', color: '#f97316', description: "L'adhésion expire dans moins de 30 jours" },
  'Paiement en retard': { icon: 'cash', color: '#eab308', description: 'Un paiement est en attente' },
  Formation: { icon: 'ribbon', color: '#3b82f6', description: 'Une formation est disponible' },
};
const DEFAULT_META = { icon: 'notifications', color: '#6b7280', description: '' };

const AppHeader = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadUnread = useCallback(async () => {
    try {
      const response = await alertes.getUnread();
      setNotifications(response.data.data || []);
    } catch (error) {
      console.log('Erreur chargement alertes:', error.response?.data || error.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUnread();
    }, [loadUnread])
  );

  const openModal = () => {
    setModalVisible(true);
    setLoading(true);
    loadUnread().finally(() => setLoading(false));
  };

  const handleMarkAsRead = async (id) => {
    setBusyId(id);
    try {
      await alertes.markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id_alerte !== id));
    } catch (error) {
      console.log('Erreur marquage alerte:', error.response?.data || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id) => {
    setBusyId(id);
    try {
      await alertes.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id_alerte !== id));
    } catch (error) {
      console.log('Erreur suppression alerte:', error.response?.data || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await alertes.markAllAsRead();
      setNotifications([]);
    } catch (error) {
      console.log('Erreur marquage global alertes:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.length;
  const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || user?.email;
  const initial = (user?.prenom || user?.nom || user?.email || 'A').charAt(0).toUpperCase();
  const photo = photoUrl(user?.photo);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + 8 },
      ]}
    >
      <View style={styles.left}>
        <View style={[styles.logoDot, { backgroundColor: colors.primary }]}>
          <Ionicons name="water" size={16} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: colors.text }]}>Aquanature</Text>
      </View>

      <View style={styles.right}>
        <TouchableOpacity style={styles.bellButton} onPress={openModal}>
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => navigation.navigate('Profil')}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.panel,
              { backgroundColor: colors.card, borderColor: colors.border, top: insets.top + 56 },
            ]}
          >
            <View style={[styles.panelHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>
                Notifications
                {unreadCount > 0 && (
                  <Text style={[styles.panelCount, { color: colors.textSecondary }]}>
                    {' '}({unreadCount} non lues)
                  </Text>
                )}
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} disabled={loading}>
                  <Text style={[styles.markAllText, { color: colors.primary }]}>
                    Tout marquer comme lu
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <ActivityIndicator style={styles.loadingIndicator} color={colors.primary} />
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={36} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Aucune notification
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id_alerte.toString()}
                style={styles.list}
                renderItem={({ item }) => {
                  const meta = ALERT_META[item.type] || DEFAULT_META;
                  return (
                    <TouchableOpacity
                      style={[styles.notifRow, { borderBottomColor: colors.border }]}
                      onPress={() => handleMarkAsRead(item.id_alerte)}
                      disabled={busyId === item.id_alerte}
                    >
                      <View style={[styles.notifIconWrap, { backgroundColor: meta.color + '20' }]}>
                        <Ionicons name={meta.icon} size={16} color={meta.color} />
                      </View>
                      <View style={styles.notifTextWrap}>
                        <Text style={[styles.notifType, { color: colors.text }]}>{item.type}</Text>
                        <Text
                          style={[styles.notifDescription, { color: colors.textSecondary }]}
                          numberOfLines={1}
                        >
                          {meta.description}
                        </Text>
                        <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                          {formatRelativeTime(item.date_envoi)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemove(item.id_alerte)}
                        disabled={busyId === item.id_alerte}
                        style={styles.notifRemove}
                      >
                        <Ionicons name="close" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  bellButton: {
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatarButton: {},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  panel: {
    position: 'absolute',
    right: 16,
    left: 16,
    maxHeight: '70%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  panelCount: {
    fontSize: 12,
    fontWeight: '400',
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    maxHeight: 360,
  },
  loadingIndicator: {
    paddingVertical: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notifIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTextWrap: {
    flex: 1,
  },
  notifType: {
    fontSize: 14,
    fontWeight: '600',
  },
  notifDescription: {
    fontSize: 12,
    marginTop: 1,
  },
  notifTime: {
    fontSize: 11,
    marginTop: 3,
  },
  notifRemove: {
    padding: 4,
  },
});

export default AppHeader;
