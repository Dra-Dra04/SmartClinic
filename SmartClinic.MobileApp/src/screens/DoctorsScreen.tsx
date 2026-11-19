import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';

export const DoctorsScreen: React.FC = () => {
  const {
    doctors,
    specialties,
    selectedSpecialtyFilter,
    setSelectedSpecialtyFilter,
    requestStartBooking,
  } = useMobileApp();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter((doc) => {
    const matchSpec = !selectedSpecialtyFilter || doc.specialtyId === selectedSpecialtyFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      doc.fullName.toLowerCase().includes(q) ||
      doc.specialtyName.toLowerCase().includes(q) ||
      doc.title.toLowerCase().includes(q);
    return matchSpec && matchSearch;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Banner Header */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerTag}>CHUYÊN GIA ĐẦU NGÀNH</Text>
        <Text style={styles.headerTitle}>Đội Ngũ Giáo Sư & Bác Sĩ</Text>
        <Text style={styles.headerSub}>
          Đặt lịch khám trực tiếp với các Phó Giáo sư, Tiến sĩ, Bác sĩ Chuyên khoa II giàu kinh nghiệm.
        </Text>

        {/* Ô tìm kiếm */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Bộ lọc Chuyên khoa ngang */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterPill, !selectedSpecialtyFilter && styles.filterPillActive]}
          onPress={() => setSelectedSpecialtyFilter(null)}
        >
          <Text style={[styles.filterPillText, !selectedSpecialtyFilter && styles.filterPillTextActive]}>
            Tất cả ({doctors.length})
          </Text>
        </TouchableOpacity>

        {specialties.map((spec) => {
          const active = selectedSpecialtyFilter === spec.id;
          return (
            <TouchableOpacity
              key={spec.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setSelectedSpecialtyFilter(spec.id)}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {spec.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Danh sách Bác sĩ */}
      <View style={styles.listSection}>
        {filteredDoctors.map((doc) => (
          <View key={doc.id} style={styles.docCard}>
            <View style={styles.docTopRow}>
              <Image source={{ uri: doc.avatarUrl }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.badgeRow}>
                  <Text style={styles.titleBadge}>{doc.title}</Text>
                  <View style={styles.ratingBox}>
                    <Ionicons name="star" size={11} color="#f59e0b" />
                    <Text style={styles.ratingText}>
                      {doc.rating} ({doc.reviewCount})
                    </Text>
                  </View>
                </View>

                <Text style={styles.docName}>{doc.fullName}</Text>
                <Text style={styles.docSpec}>{doc.specialtyName}</Text>
                <Text style={styles.docMeta}>
                  {doc.roomNumber} • {doc.experienceYears} năm kinh nghiệm
                </Text>
              </View>
            </View>

            <Text style={styles.docBio}>{doc.bio}</Text>

            <View style={styles.daysRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.primary} />
              <Text style={styles.daysText}>Lịch khám: {doc.availableDays.join(', ')}</Text>
            </View>

            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => requestStartBooking(doc)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar" size={14} color={COLORS.white} />
              <Text style={styles.bookBtnText}>Đặt lịch khám với Bác sĩ</Text>
            </TouchableOpacity>
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
    lineHeight: 16,
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
  filterScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterPillTextActive: {
    color: COLORS.white,
  },
  listSection: {
    padding: 14,
    gap: 12,
  },
  docCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  docTopRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  titleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.primarySoftBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  docName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textMain,
  },
  docSpec: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 1,
  },
  docMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  docBio: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  daysText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
