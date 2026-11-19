import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';

export const MyVisitsScreen: React.FC = () => {
  const {
    currentUser,
    appointments,
    visits,
    openAuthModal,
    cancelAppointment,
    requestStartBooking,
  } = useMobileApp();

  const [subTab, setSubTab] = useState<'emr' | 'appointments'>('emr');

  if (currentUser.role === 'guest') {
    return (
      <View style={styles.guardWrap}>
        <View style={styles.guardCard}>
          <Ionicons name="document-lock" size={40} color={COLORS.primary} />
          <Text style={styles.guardTitle}>Tra cứu Lịch hẹn & Bệnh án EMR</Text>
          <Text style={styles.guardSub}>
            Vui lòng đăng nhập tài khoản bệnh nhân để xem lịch hẹn khám, tiến trình khám 5 bước trực tiếp và đơn thuốc điện tử EMR.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() =>
              openAuthModal('Đăng nhập tài khoản để tra cứu Lịch hẹn & Hồ sơ Bệnh án EMR.')
            }
          >
            <Text style={styles.loginBtnText}>ĐĂNG NHẬP TÀI KHOẢN</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeVisit = visits[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBanner}>
        <Text style={styles.headerTag}>HỒ SƠ LÂM SÀNG SỐ HÓA</Text>
        <Text style={styles.headerTitle}>Lịch Hẹn & Tiến Trình Khám EMR</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, subTab === 'emr' && styles.tabBtnActive]}
            onPress={() => setSubTab('emr')}
          >
            <Text style={[styles.tabBtnText, subTab === 'emr' && styles.tabBtnTextActive]}>
              Tiến trình & Đơn thuốc EMR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, subTab === 'appointments' && styles.tabBtnActive]}
            onPress={() => setSubTab('appointments')}
          >
            <Text
              style={[
                styles.tabBtnText,
                subTab === 'appointments' && styles.tabBtnTextActive,
              ]}
            >
              Phiếu hẹn khám ({appointments.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        {subTab === 'emr' && activeVisit ? (
          <View>
            {/* 5-Step Live Stepper */}
            <View style={styles.card}>
              <View style={styles.visitTopRow}>
                <View>
                  <Text style={styles.visitCodeBadge}>MÃ CA KHÁM: {activeVisit.visitCode}</Text>
                  <Text style={styles.visitDocName}>{activeVisit.doctorName}</Text>
                  <Text style={styles.visitRoom}>
                    {activeVisit.specialtyName} • {activeVisit.roomNumber}
                  </Text>
                </View>
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>HOÀN TẤT KHÁM</Text>
                </View>
              </View>

              <Text style={styles.sectionSubTitle}>Tiến trình 5 bước tại viện:</Text>
              {[
                '1. Đã Check-in & Tiếp đón tại quầy',
                '2. Khám lâm sàng & Đo sinh hiệu',
                '3. Thực hiện Cận lâm sàng (Siêu âm 4D)',
                '4. Đã trả kết quả CĐHA về phòng khám',
                '5. Bác sĩ kết luận & Kê đơn thuốc EMR',
              ].map((stepLabel, idx) => (
                <View key={idx} style={styles.stepDoneRow}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.emerald} />
                  <Text style={styles.stepDoneText}>{stepLabel}</Text>
                </View>
              ))}
            </View>

            {/* Chẩn đoán & Sinh hiệu */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Kết luận Chẩn đoán Lâm sàng</Text>
              <Text style={styles.diagnosisBox}>{activeVisit.diagnosis}</Text>
              <Text style={styles.notesText}>Lời dặn: {activeVisit.clinicalNotes}</Text>

              {activeVisit.vitals && (
                <View style={styles.vitalsGrid}>
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Huyết áp</Text>
                    <Text style={styles.vitalVal}>{activeVisit.vitals.bloodPressure}</Text>
                  </View>
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>Mạch</Text>
                    <Text style={styles.vitalVal}>{activeVisit.vitals.heartRate} l/p</Text>
                  </View>
                  <View style={styles.vitalItem}>
                    <Text style={styles.vitalLabel}>BMI</Text>
                    <Text style={styles.vitalVal}>{activeVisit.vitals.bmi}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Kết quả Cận lâm sàng */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Kết quả Cận lâm sàng (PACS / RIS)</Text>
              {activeVisit.subclinicalOrders.map((sub) => (
                <View key={sub.id} style={styles.subBox}>
                  <Text style={styles.subTitle}>{sub.serviceName}</Text>
                  <Text style={styles.subDept}>
                    {sub.department} • BS thực hiện: {sub.performedBy}
                  </Text>
                  <Text style={styles.subFindings}>Mô tả: {sub.findings}</Text>
                  <Text style={styles.subConclusion}>Kết luận: {sub.conclusion}</Text>
                </View>
              ))}
            </View>

            {/* Đơn thuốc điện tử EMR */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>
                Đơn Thuốc Điện Tử EMR ({activeVisit.prescriptions.length} khoản)
              </Text>
              {activeVisit.prescriptions.map((rx, idx) => (
                <View key={rx.id} style={styles.rxItem}>
                  <Text style={styles.rxName}>
                    {idx + 1}. {rx.medicineName}
                  </Text>
                  <Text style={styles.rxMeta}>
                    Liều dùng: {rx.dosage} • {rx.duration}
                  </Text>
                  <Text style={styles.rxFreq}>{rx.frequency}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* Danh sách Phiếu hẹn khám */
          <View>
            {appointments.map((apt) => {
              const statusStr = String(apt.status);
              const statusVi =
                statusStr === 'ARRIVED'
                  ? 'ĐÃ ĐẾN KHÁM (ĐÃ CHECK-IN)'
                  : statusStr === 'CONFIRMED'
                  ? 'ĐÃ XÁC NHẬN'
                  : statusStr === 'CANCELLED'
                  ? 'ĐÃ HỦY'
                  : 'CHỜ XÁC NHẬN';

              return (
                <TouchableOpacity
                  key={apt.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (statusStr === 'ARRIVED' || statusStr === 'CONFIRMED') {
                      setSubTab('emr');
                    }
                  }}
                  style={styles.card}
                >
                  <View style={styles.visitTopRow}>
                    <Text style={styles.visitCodeBadge}>MÃ HẸN: {apt.bookingCode}</Text>
                    <Text
                      style={[
                        styles.statusTag,
                        statusStr === 'CANCELLED' && { color: COLORS.rose },
                      ]}
                    >
                      {statusVi}
                    </Text>
                  </View>
                  <Text style={styles.visitDocName}>{apt.doctorName}</Text>
                  <Text style={styles.visitRoom}>
                    {apt.specialtyName} • {apt.roomNumber}
                  </Text>
                  <Text style={styles.aptTime}>
                    ⏰ Khung giờ: {apt.timeRange} • Ngày {apt.date}
                  </Text>
                  <Text style={styles.notesText}>Triệu chứng: {apt.symptoms}</Text>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    {statusStr !== 'CANCELLED' && (
                      <TouchableOpacity
                        style={[
                          styles.cancelBtn,
                          {
                            marginTop: 0,
                            backgroundColor: COLORS.primarySoftBg,
                          },
                        ]}
                        onPress={() => setSubTab('emr')}
                      >
                        <Text style={[styles.cancelBtnText, { color: COLORS.primaryDark }]}>
                          Xem Tiến trình & Bệnh án EMR →
                        </Text>
                      </TouchableOpacity>
                    )}

                    {statusStr !== 'CANCELLED' && statusStr !== 'ARRIVED' && (
                      <TouchableOpacity
                        style={[styles.cancelBtn, { marginTop: 0 }]}
                        onPress={() => cancelAppointment(apt.id)}
                      >
                        <Text style={styles.cancelBtnText}>Hủy lịch hẹn</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => requestStartBooking()}
            >
              <Text style={styles.loginBtnText}>+ ĐẶT THÊM LỊCH KHÁM MỚI</Text>
            </TouchableOpacity>
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
  guardWrap: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  guardCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textMain,
    marginTop: 10,
    marginBottom: 6,
  },
  guardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
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
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.white,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e0f2fe',
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '900',
  },
  body: {
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
  visitTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitCodeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  visitDocName: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textMain,
    marginTop: 2,
  },
  visitRoom: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  doneBadge: {
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  doneBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  sectionSubTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 8,
    marginBottom: 6,
  },
  stepDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  stepDoneText: {
    fontSize: 12,
    color: COLORS.textMain,
    fontWeight: '600',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  diagnosisBox: {
    backgroundColor: COLORS.primarySoftBg,
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  vitalItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  vitalVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMain,
    marginTop: 2,
  },
  subBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  subDept: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  subFindings: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  subConclusion: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  rxItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  rxName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  rxMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  rxFreq: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.emeraldDark,
  },
  aptTime: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 4,
  },
  cancelBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.roseLight,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.rose,
  },
});
