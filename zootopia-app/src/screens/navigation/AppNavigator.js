import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'

import LoginScreen from '../screens/LoginScreen'
import RegistroScreen from '../screens/RegistroScreen'
import HomeScreen from '../screens/HomeScreen'
import CitasScreen from '../screens/CitasScreen'
import PerfilScreen from '../screens/PerfilScreen'
import MascotaScreen from '../screens/MascotaScreen'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#1D4ED8',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: { paddingBottom: 8, paddingTop: 4, height: 60 }
    }}>
      <Tab.Screen name="Inicio" component={HomeScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }} />
      <Tab.Screen name="Citas" component={CitasScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📅</Text> }} />
      <Tab.Screen name="Perfil" component={PerfilScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Mascota" component={MascotaScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}