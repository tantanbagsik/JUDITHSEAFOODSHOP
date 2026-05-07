import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/AuthContext';
import { RootStackParamList } from '../types';

type ProfileNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0D47A1', '#1565C0']}
          style={styles.profileHeader}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          {isAuthenticated && user ? (
            <>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </>
          ) : (
            <>
              <Text style={styles.profileName}>Guest User</Text>
              <Text style={styles.profileEmail}>Sign in to access your account</Text>
            </>
          )}
        </LinearGradient>

        {isAuthenticated ? (
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('ProfileEdit')}>
              <Ionicons name="create-outline" size={18} color="#1565C0" />
              <Text style={styles.profileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.authButtons}>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="log-in" size={20} color="#fff" />
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Ionicons name="person-add" size={20} color="#1565C0" />
              <Text style={styles.registerText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.menuSection}>
          <MenuItem
            icon="receipt-outline"
            title="Order History"
            onPress={() => handleMenuPress('Order History', isAuthenticated, navigation)}
          />
          <MenuItem
            icon="location-outline"
            title="Shipping Addresses"
            onPress={() => handleMenuPress('Shipping Addresses', isAuthenticated, navigation)}
          />
          <MenuItem
            icon="card-outline"
            title="Payment Methods"
            onPress={() => handleMenuPress('Payment Methods', isAuthenticated, navigation)}
          />
          <MenuItem
            icon="heart-outline"
            title="Wishlist"
            onPress={() => handleMenuPress('Wishlist', isAuthenticated, navigation)}
          />
          <MenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <MenuItem
            icon="settings-outline"
            title="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>JUDITHSEAFOODS v1.0</Text>
          <Text style={styles.footerSubtext}>Fresh seafood, delivered to your door</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function handleMenuPress(
  title: string,
  isAuthenticated: boolean,
  navigation: ProfileNavProp
) {
  if (!isAuthenticated) {
    Alert.alert(
      'Sign In Required',
      `Please sign in to view your ${title.toLowerCase()}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]
    );
    return;
  }

  const routeMap: Record<string, any> = {
    'Order History': 'OrderHistory',
    'Shipping Addresses': 'ShippingAddresses',
    'Payment Methods': 'PaymentMethods',
    Wishlist: 'Wishlist',
  };

  const route = routeMap[title] as keyof RootStackParamList;
  if (route) {
    (navigation.navigate as any)(route);
  }
}

function MenuItem({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color="#555" />
      <Text style={styles.menuTitle}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  profileHeader: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: { color: '#fff', fontWeight: '700', fontSize: 22, marginTop: 12 },
  profileEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  authButtons: { paddingHorizontal: 16, marginTop: -10, gap: 10 },
  loginBtn: {
    flexDirection: 'row',
    backgroundColor: '#1565C0',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loginText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1565C0',
  },
  registerText: { color: '#1565C0', fontWeight: '700', fontSize: 15 },
  profileBtn: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#1565C0',
  },
  profileBtnText: { color: '#1565C0', fontWeight: '600', fontSize: 14 },
  menuSection: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuTitle: { flex: 1, marginLeft: 14, fontSize: 15, color: '#333', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  logoutText: { color: '#FF6B6B', fontWeight: '700', fontSize: 15 },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { fontWeight: '700', color: '#888', fontSize: 13 },
  footerSubtext: { color: '#bbb', fontSize: 11, marginTop: 2 },
});
