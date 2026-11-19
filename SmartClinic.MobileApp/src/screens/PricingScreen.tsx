import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { TECHNICAL_SERVICES_PRICE } from '../data/mockData';
import { useMobileApp } from '../context/MobileAppContext';

export const PricingScreen: React.FC = () => {
  const { requestStartBooking } = useMobileApp();
  const [search, setSearch] = useState('');

  const filtered = TECHNICAL_SERVICES_PRICE.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBanner}>
        <Text style={styles.headerTag}>CÔNG KHAI VIỆN PHÍ</Text>
        <Text style={styles.headerTitle}>Bảng Giá Dịch Vụ Kỹ Thuật</Text>
        <Text style={styles.headerSub}>
          Áp dụng theo thông tư quy định của Bộ Y Tế & thanh toán Bảo hiểm Y tế trực tiếp.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm dịch vụ xét nghiệm, siêu âm, khám..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.listWrap}>
        {filtered.map((srv) => (
          <View key={srv.id} style={styles.card}>
            <View style={styles.topRow}>
              <Text style={styles.codeBadge}>{srv.code}</Text>
              <Text style={styles.catBadge}>{srv.category}</Text>
            </View>

            <Text style={styles.srvName}>{srv.name}</Text>

            <View style={styles.priceGrid}>
              <View style={styles.priceBoxBhyt}>
                <Text style={styles.priceLabel}>Giá thanh toán BHYT</Text>
                <Text style={styles.bhytVal}>{srv.bhytPrice.toLocaleString('vi-VN')} đ</Text>
              </View>
              <View style={styles.priceBoxService}>
                <Text style={styles.priceLabel}>Giá khám theo yêu cầu</Text>
                <Text style={styles.serviceVal}>{srv.servicePrice.toLocaleString('vi-VN')} đ</Text>
              </View>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.timeText}>⏱ Thời gian trả KQ: {srv.turnaroundTime}</Text>
              <TouchableOpacity
                style={styles.bookSmallBtn}
                onPress={() => requestStartBooking()}
              >
                <Text style={styles.bookSmallBtnText}>Đặt lịch →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBanner: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fde68a',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
  },
  headerSub: {
    fontSize: 11,
    color: '#e0f2fe',
    marginTop: 4,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMain,
  },
  listWrap: {
    padding: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  codeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoftBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
  },
  catBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  srvName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 10,
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  priceBoxBhyt: {
    flex: 1,
    backgroundColor: COLORS.emeraldLight,
    padding: 8,
    borderRadius: 8,
  },
  priceBoxService: {
    flex: 1,
    backgroundColor: COLORS.primarySoftBg,
    padding: 8,
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  bhytVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.emeraldDark,
    marginTop: 2,
  },
  serviceVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  timeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  bookSmallBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookSmallBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
