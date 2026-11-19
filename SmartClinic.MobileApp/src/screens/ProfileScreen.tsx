import { AuthenticatedAvatar } from '../components/AuthenticatedAvatar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  ActivityIndicator,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    openAuthModal,
    logoutToGuest,
    updateUserProfile, avatarSource, uploadAvatar, sessionLoading, sessionError, retrySession,
  } = useMobileApp();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState('');
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName || '',
    phone: currentUser.phone || '',
    email: currentUser.email || '',
    dateOfBirth: currentUser.dateOfBirth || '',
    gender: currentUser.gender || 'Khác',
    idCardNumber: currentUser.idCardNumber || '',
    healthInsuranceNumber: currentUser.healthInsuranceNumber || '',
    address: currentUser.address || '',
    heightCm: currentUser.heightCm == null ? '' : String(currentUser.heightCm),
    weightKg: currentUser.weightKg == null ? '' : String(currentUser.weightKg),
    bloodType: currentUser.bloodType || '',
    allergies: currentUser.allergies?.join('\n') || '',
    medicalHistory: currentUser.medicalHistory?.join('\n') || '',
  });

  useEffect(() => {
    if (isEditing) return;
    setFormData({
      fullName: currentUser.fullName || '',
      phone: currentUser.phone || '',
      email: currentUser.email || '',
      dateOfBirth: currentUser.dateOfBirth || '',
      gender: currentUser.gender || 'Khác',
      idCardNumber: currentUser.idCardNumber || '',
      healthInsuranceNumber: currentUser.healthInsuranceNumber || '',
      address: currentUser.address || '',
      heightCm: currentUser.heightCm == null ? '' : String(currentUser.heightCm),
      weightKg: currentUser.weightKg == null ? '' : String(currentUser.weightKg),
      bloodType: currentUser.bloodType || '',
      allergies: currentUser.allergies?.join('\n') || '',
      medicalHistory: currentUser.medicalHistory?.join('\n') || '',
    });
  }, [currentUser, isEditing]);

  useEffect(() => { setIsEditing(false); setError(''); setSaveSuccess(false); }, [currentUser.id]);

  useEffect(() => { setAvatarFailed(false); }, [avatarSource?.uri]);

  const handleSaveProfile = async () => {
    if (busy) return;
    setBusy(true); setError(''); setSaveSuccess(false);
    try { await updateUserProfile({
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      dateOfBirth: formData.dateOfBirth.trim(),
      gender: formData.gender as any,
      idCardNumber: formData.idCardNumber.trim(),
      healthInsuranceNumber: formData.healthInsuranceNumber.trim(),
      address: formData.address.trim(),
      heightCm: formData.heightCm.trim() ? Number(formData.heightCm) : undefined,
      weightKg: formData.weightKg.trim() ? Number(formData.weightKg) : undefined,
      bloodType: formData.bloodType,
      allergies: formData.allergies
        ? formData.allergies
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      medicalHistory: formData.medicalHistory
        ? formData.medicalHistory
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],

    });
    setIsEditing(false);
    setSaveSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được hồ sơ.'); }
    finally { setBusy(false); }
  };
  const chooseAvatar = async () => {
    if (busy) return;
    setBusy(true); setError(''); setSaveSuccess(false); setAvatarNotice('');
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Vui lòng cho phép truy cập ảnh để đổi ảnh đại diện.');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (result.canceled) return;
      const image = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 512 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
      await uploadAvatar(image.uri);
      setAvatarNotice('Đã cập nhật ảnh đại diện.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được ảnh.'); }
    finally { setBusy(false); }
  };
  if (sessionLoading) return <View style={{ padding: 24 }}><ActivityIndicator /><Text>Đang tải hồ sơ...</Text></View>;


  if (currentUser.role === 'guest') {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.guestContainer}>
          {!!sessionError && <View><Text style={{ color: '#b91c1c' }}>{sessionError}</Text><TouchableOpacity onPress={() => void retrySession()}><Text style={{ padding: 12 }}>Thử tải lại phiên</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={logoutToGuest}><Text style={{ padding: 12 }}>Xóa phiên đã lưu</Text></TouchableOpacity></View>}
          {/* Logo PHÚC AN CARE+ */}
          <View style={{ alignItems: 'center', marginBottom: 14 }}>
            <Image source={require('../../assets/phuc-an-logo.png')} style={{ width: 56, height: 52, marginBottom: 8 }} resizeMode="contain" />
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.primary, textAlign: 'center' }}>
              PHÚC AN HOSPITAL
            </Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 }}>
              BỆNH VIỆN ĐA KHOA QUỐC TẾ PHÚC AN
            </Text>
          </View>

          {/* Vòng tròn User */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: COLORS.primarySoftBg,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: 12,
            }}
          >
            <Ionicons name="person-outline" size={38} color={COLORS.primary} />
          </View>

          <Text style={[styles.guestTitle, { textAlign: 'center' }]}>Chào mừng bạn!</Text>
          <Text style={styles.guestDesc}>
            Đăng nhập để trải nghiệm đầy đủ các tính năng của Bệnh viện Đa khoa Quốc tế Phúc An
          </Text>

          {/* Khối Lợi ích khi có tài khoản */}
          <View style={[styles.guestCard, { alignItems: 'flex-start', width: '100%', marginBottom: 16 }]}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textMain, marginBottom: 12 }}>
              Lợi ích khi có tài khoản:
            </Text>

            {[
              { icon: 'calendar-outline', text: 'Đặt lịch khám nhanh chóng' },
              { icon: 'clipboard-outline', text: 'Quản lý lịch sử khám bệnh & EMR' },
              { icon: 'heart-outline', text: 'Lưu bác sĩ và cơ sở y tế yêu thích' },
              { icon: 'notifications-outline', text: 'Nhận thông báo nhắc lịch khám' },
            ].map((item, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: idx < 3 ? 10 : 0,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: COLORS.primarySoftBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={item.icon as any} size={17} color={COLORS.primary} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.textSecondary }}>
                  {item.text}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginBottom: 10, borderRadius: 14, paddingVertical: 14 }]}
            onPress={() => openAuthModal()}
          >
            <Text style={styles.primaryBtnText}>Đăng nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: COLORS.white,
              borderWidth: 2,
              borderColor: COLORS.primary,
              paddingVertical: 13,
              borderRadius: 14,
              width: '100%',
              alignItems: 'center',
            }}
            onPress={() => openAuthModal(undefined, 'register')}
          >
            <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '800' }}>
              Tạo tài khoản mới
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        {avatarSource && !avatarFailed ? (
          <AuthenticatedAvatar source={avatarSource} style={styles.avatar} onFailure={setAvatarFailed} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={28} color={COLORS.white} />
          </View>
        )}
        {avatarFailed && <TouchableOpacity onPress={() => { setAvatarFailed(false); void retrySession(); }}><Text style={{ color: '#b91c1c', padding: 8 }}>Không tải được ảnh. Chạm để thử lại.</Text></TouchableOpacity>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Thay ảnh đại diện"
          disabled={busy} onPress={() => void chooseAvatar()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.white,
            borderRadius: 9, paddingHorizontal: 12, paddingVertical: 9, marginTop: 10, marginBottom: 12,
            opacity: busy ? 0.6 : 1 }}>
          <Ionicons name="camera-outline" size={18} color="#16a34a" />
          <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 12 }}>{busy ? 'Đang xử lý…' : 'Thay ảnh'}</Text>
        </TouchableOpacity>
        {!!avatarNotice && <Text accessibilityLiveRegion="polite" style={{ color: '#15803d', marginBottom: 8 }}>{avatarNotice}</Text>}
        <Text style={styles.nameText}>{currentUser.fullName}</Text>
        <Text style={styles.phoneText}>
          {currentUser.phone} • {currentUser.email}
        </Text>
        <View
          style={[
            styles.verifyBadge,
            !currentUser.isProfileCompleted && { backgroundColor: COLORS.amberLight },
          ]}
        >
          <Text
            style={[
              styles.verifyBadgeText,
              !currentUser.isProfileCompleted && { color: COLORS.amberDark },
            ]}
          >
            {currentUser.isProfileCompleted
              ? '✓ Đã hoàn thiện hồ sơ'
              : 'Cần bổ sung thông tin hồ sơ'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerEditBtn}
          disabled={busy}
          onPress={() => {
            setIsEditing(!isEditing);
            setSaveSuccess(false);
          }}
        >
          <Ionicons
            name={isEditing ? 'eye-outline' : 'create-outline'}
            size={15}
            color={COLORS.primaryDark}
          />
          <Text style={styles.headerEditBtnText}>
            {isEditing ? 'Xem thông tin cá nhân' : 'Thay đổi thông tin cá nhân'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {busy && <ActivityIndicator color={COLORS.primary} />}
        {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</Text>}
        {saveSuccess && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.emeraldDark} />
            <Text style={styles.successBannerText}>
              Đã cập nhật thông tin cá nhân thành công!
            </Text>
          </View>
        )}

        {!currentUser.isProfileCompleted && !isEditing && (
          <TouchableOpacity
            style={styles.completeAlertBtn}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create" size={18} color={COLORS.white} />
            <Text style={styles.completeAlertBtnText}>
              Bổ sung CCCD & BHYT ngay để mở khóa Đặt lịch
            </Text>
          </TouchableOpacity>
        )}

        {!isEditing ? (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Họ và tên</Text>
                <Text style={styles.infoVal}>{currentUser.fullName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoVal}>{currentUser.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoVal}>{currentUser.email || 'Chưa cập nhật'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày sinh & Giới tính</Text>
                <Text style={styles.infoVal}>
                  {currentUser.dateOfBirth || '--'} ({currentUser.gender || 'Khác'})
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số CCCD</Text>
                <Text style={styles.infoVal}>
                  {currentUser.idCardNumber || 'Chưa cập nhật'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã thẻ BHYT</Text>
                <Text style={styles.infoVal}>
                  {currentUser.healthInsuranceNumber || 'Chưa cập nhật'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ</Text>
                <Text style={styles.infoVal}>
                  {currentUser.address || 'Chưa cập nhật'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cao / Nặng / Nhóm máu</Text>
                <Text style={styles.infoVal}>
                  {currentUser.heightCm ?? '--'} cm • {currentUser.weightKg ?? '--'} kg • {currentUser.bloodType || ''}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tiền sử dị ứng</Text>
                <Text style={[styles.infoVal, { color: COLORS.rose }]}>
                  {currentUser.allergies?.join('\n') || 'Không ghi nhận'}
                </Text>
              </View>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoLabel}>Bệnh lý nền</Text>
                <Text style={styles.infoVal}>
                  {currentUser.medicalHistory?.join('\n') || 'Không có'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { marginBottom: 10 }]}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.primaryBtnText}>CHỈNH SỬA THÔNG TIN CÁ NHÂN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={logoutToGuest}>
              <Ionicons name="log-out-outline" size={16} color={COLORS.rose} />
              <Text style={styles.logoutBtnText}>Đăng xuất (Về chế độ Khách vãng lai)</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Cập nhật Thông tin Cá nhân</Text>

            <Text style={styles.inputLabel}>Họ và tên *</Text>
            <TextInput
              style={styles.inputField}
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              placeholder="Nhập họ và tên"
            />

            <Text style={styles.inputLabel}>Số điện thoại *</Text>
            <TextInput
              style={styles.inputField}
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.inputField}
              value={formData.email}
              editable={false}
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Giới tính *</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginVertical: 12 }}>{(['Nam', 'Nữ', 'Khác'] as const).map(gender => <TouchableOpacity key={gender} onPress={() => setFormData({ ...formData, gender })}><Text style={{ color: formData.gender === gender ? COLORS.primary : COLORS.textSecondary }}>{formData.gender === gender ? '● ' : '○ '}{gender}</Text></TouchableOpacity>)}</View>
            <Text style={styles.inputLabel}>Ngày sinh (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.inputField}
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            />

            <Text style={styles.inputLabel}>CCCD (hoặc nhập BHYT bên dưới)</Text>
            <TextInput
              style={styles.inputField}
              value={formData.idCardNumber}
              onChangeText={(text) => setFormData({ ...formData, idCardNumber: text })}
              placeholder="12 chữ số CCCD"
            />

            <Text style={styles.inputLabel}>Mã thẻ BHYT</Text>
            <TextInput
              style={styles.inputField}
              value={formData.healthInsuranceNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, healthInsuranceNumber: text })
              }
              placeholder="VD: DN4018899123456"
            />

            <Text style={styles.inputLabel}>Địa chỉ cư trú *</Text>
            <TextInput
              style={styles.inputField}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
                <TextInput
                  style={styles.inputField}
                  value={formData.heightCm}
                  onChangeText={(text) => setFormData({ ...formData, heightCm: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
                <TextInput
                  style={styles.inputField}
                  value={formData.weightKg}
                  onChangeText={(text) => setFormData({ ...formData, weightKg: text })}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Nhóm máu</Text>
                <TextInput
                  style={styles.inputField}
                  value={formData.bloodType}
                  onChangeText={(text) => setFormData({ ...formData, bloodType: text })}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Tiền sử dị ứng thuốc / thức ăn</Text>
            <TextInput
              style={styles.inputField}
              value={formData.allergies}
              onChangeText={(text) => setFormData({ ...formData, allergies: text })}
            />

            <Text style={styles.inputLabel}>Bệnh lý nền</Text>
            <TextInput
              style={styles.inputField}
              value={formData.medicalHistory}
              onChangeText={(text) => setFormData({ ...formData, medicalHistory: text })}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.secondaryBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                disabled={busy}
                onPress={() => void handleSaveProfile()}
              >
                <Text style={styles.primaryBtnText}>LƯU THAY ĐỔI</Text>
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
  guestContainer: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  guestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textMain,
    marginTop: 8,
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  secondaryBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  profileHeader: {
    backgroundColor: COLORS.primary,
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 8,
  },
  phoneText: {
    fontSize: 11,
    color: '#e0f2fe',
    marginTop: 2,
  },
  verifyBadge: {
    marginTop: 10,
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  verifyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  headerEditBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  headerEditBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  body: {
    padding: 14,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.emeraldLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  successBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.emeraldDark,
  },
  completeAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.amberDark,
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 12,
  },
  completeAlertBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  editLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMain,
    maxWidth: '60%',
    textAlign: 'right',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textMain,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.roseLight,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.rose,
  },
});
