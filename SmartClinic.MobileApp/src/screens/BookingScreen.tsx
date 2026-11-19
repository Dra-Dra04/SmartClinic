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
import { Doctor, TimeSlot } from '../types';

export const BookingScreen: React.FC = () => {
  const {
    currentUser,
    doctors,
    timeSlots,
    selectedDoctorForBooking,
    openAuthModal,
    setIsOnboardingGateOpen,
    confirmNewAppointment,
    setActiveTab,
  } = useMobileApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [chosenDoctor, setChosenDoctor] = useState<Doctor>(
    selectedDoctorForBooking || doctors[0]
  );
  const [chosenDate, setChosenDate] = useState('03/11/2026');
  const [chosenSlot, setChosenSlot] = useState<TimeSlot | null>(timeSlots[2]);
  const [symptoms, setSymptoms] = useState('');
  const [bookingSuccessCode, setBookingSuccessCode] = useState<string | null>(null);

  // 1. Nếu là Khách vãng lai (Chưa đăng nhập) -> Hiện cảnh báo yêu cầu đăng nhập / đăng ký
  if (currentUser.role === 'guest') {
    return (
      <View style={styles.guardContainer}>
        <View style={styles.guardCard}>
          <View style={styles.guardIconCircle}>
            <Ionicons name="lock-closed" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.guardBadge}>YÊU CẦU TÀI KHOẢN BỆNH NHÂN</Text>
          <Text style={styles.guardTitle}>Bạn chưa đăng nhập tài khoản</Text>
          <Text style={styles.guardDesc}>
            Vui lòng đăng ký hoặc đăng nhập tài khoản bệnh nhân để tiến hành đặt lịch khám và nhận mã QR ưu tiên tại Bệnh viện Đa khoa Quốc tế Phúc An.
          </Text>

          <TouchableOpacity
            style={styles.guardPrimaryBtn}
            onPress={() =>
              openAuthModal(
                'Vui lòng đăng ký hoặc đăng nhập tài khoản để tiến hành đặt lịch khám!'
              )
            }
          >
            <Text style={styles.guardPrimaryBtnText}>ĐĂNG NHẬP / ĐĂNG KÝ NGAY</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. Nếu là Bệnh nhân mới đăng ký nhưng chưa cập nhật CCCD / BHYT -> Chốt chặn HIS Onboarding Gate
  if (!currentUser.isProfileCompleted) {
    return (
      <View style={styles.guardContainer}>
        <View style={[styles.guardCard, { borderColor: '#fcd34d' }]}>
          <View style={[styles.guardIconCircle, { backgroundColor: COLORS.amberLight }]}>
            <Ionicons name="shield-half" size={28} color={COLORS.amberDark} />
          </View>
          <Text style={[styles.guardBadge, { color: COLORS.amberDark }]}>
            CHỐT CHẶN ĐỊNH DANH HỒ SƠ Y TẾ (HIS ONBOARDING GATE)
          </Text>
          <Text style={styles.guardTitle}>Cần hoàn tất Hồ sơ Cá nhân trước khi Đặt lịch</Text>
          <Text style={styles.guardDesc}>
            Theo quy định tiếp nhận bệnh nhân điện tử, bạn cần cập nhật Số CCCD hoặc Mã thẻ BHYT để đồng bộ hồ sơ bệnh án EMR trước khi chọn giờ khám.
          </Text>

          <TouchableOpacity
            style={styles.guardPrimaryBtn}
            onPress={() => setIsOnboardingGateOpen(true)}
          >
            <Text style={styles.guardPrimaryBtnText}>CẬP NHẬT CCCD / BHYT NGAY</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Màn hình hoàn tất đặt lịch
  if (bookingSuccessCode) {
    return (
      <View style={styles.guardContainer}>
        <View style={styles.guardCard}>
          <View style={[styles.guardIconCircle, { backgroundColor: COLORS.emeraldLight }]}>
            <Ionicons name="checkmark-circle" size={34} color={COLORS.emerald} />
          </View>
          <Text style={[styles.guardBadge, { color: COLORS.emeraldDark }]}>
            ĐẶT LỊCH KHÁM THÀNH CÔNG
          </Text>
          <Text style={styles.guardTitle}>Mã hẹn: {bookingSuccessCode}</Text>
          <Text style={styles.guardDesc}>
            Bác sĩ: {chosenDoctor.title} {chosenDoctor.fullName} ({chosenDoctor.roomNumber}){'\n'}
            Thời gian: {chosenSlot?.timeRange} • Ngày {chosenDate}
          </Text>

          <TouchableOpacity
            style={styles.guardPrimaryBtn}
            onPress={() => {
              setBookingSuccessCode(null);
              setActiveTab('visits');
            }}
          >
            <Text style={styles.guardPrimaryBtnText}>XEM PHIẾU HẸN & MÃ QR CHECK-IN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Thanh tiến trình 3 bước */}
      <View style={styles.stepperHeader}>
        <Text style={styles.stepperTitle}>Đặt Lịch Khám Trực Tuyến 3 Bước</Text>
        <View style={styles.stepsRow}>
          {[
            { id: 1, label: '1. Chọn Bác sĩ' },
            { id: 2, label: '2. Chọn Khung giờ' },
            { id: 3, label: '3. Xác nhận' },
          ].map((s) => {
            const active = step >= s.id;
            return (
              <View
                key={s.id}
                style={[styles.stepPill, active && styles.stepPillActive]}
              >
                <Text style={[styles.stepPillText, active && styles.stepPillTextActive]}>
                  {s.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.bodyPadding}>
        {/* BƯỚC 1: CHỌN BÁC SĨ CHUYÊN KHOA */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Bước 1: Chọn Bác sĩ Chuyên khoa</Text>
            {doctors.map((doc) => {
              const isSelected = chosenDoctor.id === doc.id;
              return (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.docOptionCard, isSelected && styles.docOptionCardActive]}
                  onPress={() => setChosenDoctor(doc)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: doc.avatarUrl }} style={styles.docThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docTitle}>{doc.title}</Text>
                    <Text style={styles.docName}>{doc.fullName}</Text>
                    <Text style={styles.docSpec}>
                      {doc.specialtyName} • {doc.roomNumber}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setStep(2)}
            >
              <Text style={styles.nextBtnText}>Tiếp tục chọn khung giờ →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* BƯỚC 2: CHỌN NGÀY & KHUNG GIỜ 30 PHÚT (CHỐNG OVERBOOKING) */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Bước 2: Chọn Ngày & Khung giờ 30 phút</Text>
            <View style={styles.dateRow}>
              {['03/11/2026', '04/11/2026', '05/11/2026'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dateChip, chosenDate === d && styles.dateChipActive]}
                  onPress={() => setChosenDate(d)}
                >
                  <Text
                    style={[
                      styles.dateChipText,
                      chosenDate === d && styles.dateChipTextActive,
                    ]}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.subLabel}>
              Khung giờ khám (Tối đa 5 bệnh nhân / slot để tránh quá tải):
            </Text>
            <View style={styles.slotGrid}>
              {timeSlots.map((slot) => {
                const isFull = slot.bookedCount >= slot.maxCapacity;
                const isSelected = chosenSlot?.id === slot.id;
                return (
                  <TouchableOpacity
                    key={slot.id}
                    disabled={isFull}
                    style={[
                      styles.slotCard,
                      isFull && styles.slotCardFull,
                      isSelected && styles.slotCardSelected,
                    ]}
                    onPress={() => setChosenSlot(slot)}
                  >
                    <Text
                      style={[
                        styles.slotTime,
                        isFull && { color: COLORS.textMuted },
                        isSelected && { color: COLORS.white },
                      ]}
                    >
                      {slot.timeRange}
                    </Text>
                    <Text
                      style={[
                        styles.slotCap,
                        isFull && { color: COLORS.rose },
                        isSelected && { color: '#e0f2fe' },
                      ]}
                    >
                      {isFull
                        ? 'Đã kín chỗ (5/5)'
                        : `Còn nhận (${slot.bookedCount}/${slot.maxCapacity})`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setStep(3)}
              >
                <Text style={styles.nextBtnText}>Tiếp tục xác nhận →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* BƯỚC 3: NHẬP TRIỆU CHỨNG & XÁC NHẬN */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionTitle}>Bước 3: Xác nhận Thông tin Đặt lịch</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryRow}>
                • Bệnh nhân: <Text style={styles.bold}>{currentUser.fullName}</Text> ({currentUser.phone})
              </Text>
              <Text style={styles.summaryRow}>
                • CCCD: <Text style={styles.bold}>{currentUser.idCardNumber}</Text>
              </Text>
              <Text style={styles.summaryRow}>
                • Bác sĩ: <Text style={styles.bold}>{chosenDoctor.title} {chosenDoctor.fullName}</Text>
              </Text>
              <Text style={styles.summaryRow}>
                • Chuyên khoa: <Text style={styles.bold}>{chosenDoctor.specialtyName}</Text> ({chosenDoctor.roomNumber})
              </Text>
              <Text style={styles.summaryRow}>
                • Khung giờ: <Text style={styles.bold}>{chosenSlot?.timeRange} ngày {chosenDate}</Text>
              </Text>
            </View>

            <Text style={styles.subLabel}>Mô tả triệu chứng / Lý do khám:</Text>
            <TextInput
              style={styles.symptomInput}
              multiline
              numberOfLines={3}
              placeholder="Nhập triệu chứng hiện tại (ví dụ: Đau thượng vị, tức ngực, đau đầu...)"
              placeholderTextColor={COLORS.textMuted}
              value={symptoms}
              onChangeText={setSymptoms}
            />

            <View style={styles.navBtnRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>← Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => {
                  if (!chosenSlot) return;
                  const apt = confirmNewAppointment({
                    doctor: chosenDoctor,
                    date: chosenDate,
                    slot: chosenSlot,
                    symptoms,
                  });
                  setBookingSuccessCode(apt.bookingCode);
                }}
              >
                <Text style={styles.nextBtnText}>XÁC NHẬN ĐẶT LỊCH NGAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  guardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 18,
    justifyContent: 'center',
  },
  guardCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guardIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoftBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  guardBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  guardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },
  guardDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  guardPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: '100%',
  },
  guardPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  stepperHeader: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  stepperTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.white,
    marginBottom: 10,
  },
  stepsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
  },
  stepPillActive: {
    backgroundColor: COLORS.amber,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#e0f2fe',
  },
  stepPillTextActive: {
    color: COLORS.textMain,
    fontWeight: '900',
  },
  bodyPadding: {
    padding: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 10,
  },
  docOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  docOptionCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primarySoftBg,
  },
  docThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  docTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  docName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  docSpec: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  dateChipTextActive: {
    color: COLORS.white,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: 16,
  },
  slotCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  slotCardFull: {
    backgroundColor: '#f1f5f9',
    opacity: 0.65,
  },
  slotCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotTime: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  slotCap: {
    fontSize: 10,
    color: COLORS.emeraldDark,
    marginTop: 2,
    fontWeight: '700',
  },
  summaryBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    gap: 5,
  },
  summaryRow: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bold: {
    fontWeight: '800',
    color: COLORS.textMain,
  },
  symptomInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 12,
    color: COLORS.textMain,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  navBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  nextBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
