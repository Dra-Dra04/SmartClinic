import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';

export const HeaderBar: React.FC = () => {
  const { setActiveTab } = useMobileApp();

  return (
    <View style={styles.wrapper}>
      {/* Main Hospital Top Header */}
      <View style={styles.headerContainer}>
        {/* Left: Hospital Logo & Name */}
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
        >
          <View style={styles.logoEmblem}>
            <Ionicons name="fitness" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.brandTextWrap}>
            <Text style={styles.subBrand} numberOfLines={1}>
              PHUC AN INTERNATIONAL GENERAL HOSPITAL
            </Text>
            <Text style={styles.mainBrand} numberOfLines={2}>
              Bệnh viện Đa khoa Quốc tế Phúc An
            </Text>
          </View>
        </TouchableOpacity>

      </View>

      {/* Ocean Blue Navigation Strip (#0084c7) */}
      <View style={styles.oceanNavStrip}>
        <Text style={styles.sloganText}>
          Kỷ cương - Trách nhiệm - Chuyên nghiệp - Tận tâm • Hotline: (024) 3 577 3888
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  logoEmblem: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandTextWrap: {
    flex: 1,
  },
  subBrand: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  },
  mainBrand: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  oceanNavStrip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  sloganText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '700',
  },
});
