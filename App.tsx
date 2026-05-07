import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import './src/global.css';
import HomeScreen from './src/screens/HomeScreen';
import StoresScreen from './src/screens/StoresScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StoreMenuScreen from './src/screens/StoreMenuScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import StubScreen from './src/screens/StubScreen';
import { RootStackParamList, TabParamList } from './src/types';
import { AuthProvider } from './src/hooks/AuthContext';
import { CartProvider } from './src/hooks/CartContext';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: 6,
          paddingTop: 6,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Stores':
              iconName = focused ? 'storefront' : 'storefront-outline';
              break;
            case 'Cart':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help';
          }
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stores" component={StoresScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="StoreMenu" component={StoreMenuScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="OrderHistory" component={StubScreen} initialParams={{ title: 'Order History', icon: 'receipt-outline' }} />
          <Stack.Screen name="ShippingAddresses" component={StubScreen} initialParams={{ title: 'Shipping Addresses', icon: 'location-outline' }} />
          <Stack.Screen name="PaymentMethods" component={StubScreen} initialParams={{ title: 'Payment Methods', icon: 'card-outline' }} />
          <Stack.Screen name="Wishlist" component={StubScreen} initialParams={{ title: 'Wishlist', icon: 'heart-outline' }} />
          <Stack.Screen name="HelpSupport" component={StubScreen} initialParams={{ title: 'Help & Support', icon: 'help-circle-outline', message: 'Contact JUDITHSEAFOODS support for assistance with your orders and account.' }} />
          <Stack.Screen name="Settings" component={StubScreen} initialParams={{ title: 'Settings', icon: 'settings-outline', message: 'App settings and preferences will be available soon.' }} />
        </Stack.Navigator>
      </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
