import React, { useEffect } from 'react';
import {
  SafeAreaView,
  BackHandler,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './src/theme/colors';
import { MobileAppProvider, useMobileApp } from './src/context/MobileAppContext';
import { BotIcon } from './src/components/BotIcon';
import { AuthPromptModal } from './src/components/AuthPromptModal';
import { HomeScreen } from './src/screens/HomeScreen';
import { ClinicDoctorsScreen, ClinicBookingScreen, ClinicVisitsScreen } from './src/screens/ClinicScreens';
import { PricingScreen } from './src/screens/PricingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AIChatScreen } from './src/screens/AIChatScreen';
import { MobileTabName } from './src/types';

const MainMobileShell: React.FC = () => {
  const { activeTab, setActiveTab, requestStartBooking } = useMobileApp();

  const isChatOpen = activeTab === 'ai-chat';
  useEffect(() => {
    if (!isChatOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setActiveTab('home');
      return true;
    });
    return () => subscription.remove();
  }, [isChatOpen, setActiveTab]);

  const bottomTabs: {
    id: MobileTabName;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: 'home', label: 'Trang chủ', icon: 'home' },
    { id: 'doctors', label: 'Tìm Bác sĩ', icon: 'people' },
    { id: 'booking', label: 'Đặt lịch', icon: 'calendar' },
    { id: 'visits', label: 'Lịch & EMR', icon: 'pulse' },
    { id: 'profile', label: 'Tài khoản', icon: 'person' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* 2. Vùng hiển thị các Màn hình */}
      <View style={styles.contentArea}>
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'doctors' && <ClinicDoctorsScreen />}
        {activeTab === 'pricing' && <PricingScreen />}
        {activeTab === 'booking' && <ClinicBookingScreen />}
        {activeTab === 'visits' && <ClinicVisitsScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
        {activeTab === 'ai-chat' && <AIChatScreen />}

        {/* Nút Tròn Nổi (Floating Action Button) Chuyển Nhanh Sang Chat Với AI */}
        {activeTab !== 'ai-chat' && (
          <TouchableOpacity
            style={styles.floatingAiBtn}
            onPress={() => setActiveTab('ai-chat')}
            activeOpacity={0.9}
          >
            <BotIcon size={28} color={COLORS.white} />
            <View style={styles.floatingAiOnlineDot} />
          </TouchableOpacity>
        )}
      </View>

      {/* 3. Thanh Điều hướng Đáy (Bottom Tab Navigation) */}
      <View style={styles.bottomBar}>
        {bottomTabs.map((tab) => {
          const isFocused = activeTab === tab.id;
          const isCenterCTA = tab.id === 'booking';

          if (isCenterCTA) {
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.centerBookingTab}
                onPress={() => requestStartBooking()}
                activeOpacity={0.85}
              >
                <View style={styles.centerBookingCircle}>
                  <Ionicons name="calendar" size={20} color={COLORS.white} />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    isFocused && styles.tabLabelActive,
                    { fontWeight: '800', color: COLORS.primary },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={23}
                color={isFocused ? COLORS.primary : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. Global Auth & Onboarding Gate Modals */}
      <AuthPromptModal />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <MobileAppProvider>
      <MainMobileShell />
    </MobileAppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  contentArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  floatingAiBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: '#005a8b',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingAiOnlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#38bdf8',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  tabItem: {
    minHeight: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  centerBookingTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBookingCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
