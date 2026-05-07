import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type StubParams = {
  Stub: { title: string; icon?: string; message?: string };
};

export default function StubScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<StubParams, 'Stub'>>();
  const { title, icon = 'construct-outline', message } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1565C0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.content}>
        <Ionicons name={icon as any} size={64} color="#ccc" />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>
          {message || `The ${title.toLowerCase()} feature is coming soon in JUDITHSEAFOODS.`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontWeight: '700', fontSize: 17, color: '#333', marginRight: 30 },
  placeholder: { width: 30 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontWeight: '700', fontSize: 20, color: '#333', marginTop: 16 },
  message: { color: '#888', textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 20 },
});
