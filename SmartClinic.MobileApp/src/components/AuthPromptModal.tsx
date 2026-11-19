import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';

export const AuthPromptModal: React.FC = () => {
  const { isAuthModalOpen, authMode, authPromptMessage, closeAuthModal, login, register,
    isOnboardingGateOpen, setIsOnboardingGateOpen, setActiveTab } = useMobileApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (isAuthModalOpen) setMode(authMode); }, [isAuthModalOpen, authMode]);
  useEffect(() => {
    if (!isAuthModalOpen) { setPassword(''); setConfirmation(''); setShowPassword(false); setShowConfirmation(false); setError(''); setNotice(''); }
  }, [isAuthModalOpen]);
  const submit = async () => {
    if (busy) return;
    setError(''); setNotice('');
    if (!email.trim() || !password) { setError('Vui lòng nhập email và mật khẩu.'); return; }
    if (mode === 'register') {
      if (password.length < 10 || password.length > 128 || !password.trim()) {
        setError('Mật khẩu cần từ 10 đến 128 ký tự. Hiện đã nhập ' + password.length + ' ký tự.'); return;
      }
      if (password !== confirmation) {
        setError('Xác nhận mật khẩu chưa khớp với mật khẩu đã nhập.'); return;
      }
      if (!/^\+?[0-9]{9,15}$/.test(phone.trim())) {
        setError('Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng dấu +.'); return;
      }
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(email, password, confirmation, phone);
        setMode('login'); setPassword(''); setConfirmation(''); setShowPassword(false); setShowConfirmation(false);
        setNotice('Đăng ký thành công. Vui lòng đăng nhập để cập nhật hồ sơ.');
      } else { await login(email, password); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể thực hiện.'); }
    finally { setBusy(false); }
  };
  return <>
    <Modal visible={isAuthModalOpen} transparent animationType="slide" onRequestClose={() => { if (!busy) closeAuthModal(); }}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheetContainer}>
          <View style={styles.modalHeader}><View style={styles.modalTitleRow}>
            <Text style={[styles.modalTitle, { flex: 1 }]}>Tài khoản bệnh nhân</Text>
            <TouchableOpacity accessibilityLabel="Đóng" disabled={busy} onPress={closeAuthModal} style={styles.closeBtn}><Ionicons name="close" size={24} /></TouchableOpacity>
          </View></View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', marginBottom: 18 }}>
              <Image source={require('../../assets/phuc-an-logo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
              <Text style={{ marginTop: 6, color: COLORS.primary, fontSize: 20, fontWeight: '900' }}>PHÚC AN HOSPITAL</Text>
            </View>
            {!!authPromptMessage && <Text style={styles.noticeText}>{authPromptMessage}</Text>}
            <View style={styles.tabSwitchRow}>
              {(['login', 'register'] as const).map(value => <TouchableOpacity key={value} disabled={busy} style={[styles.tabBtn, mode === value && styles.tabBtnActive]} onPress={() => { setMode(value); setShowPassword(false); setShowConfirmation(false); setError(''); setNotice(''); }}>
                <Text style={[styles.tabBtnText, mode === value && styles.tabBtnTextActive]}>{value === 'login' ? 'Đăng nhập' : 'Đăng ký'}</Text>
              </TouchableOpacity>)}
            </View>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="email@example.com" />
            {mode === 'register' && <><Text style={styles.inputLabel}>Số điện thoại *</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} editable={!busy} keyboardType="phone-pad" /></>}
            <Text style={styles.inputLabel}>Mật khẩu *</Text>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword}
                editable={!busy} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false}
                accessibilityLabel="Mật khẩu" />
              <TouchableOpacity accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                disabled={busy} onPress={() => setShowPassword(value => !value)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            {mode === 'register' && <>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu *</Text>
              <View style={styles.passwordRow}>
                <TextInput style={styles.passwordInput} value={confirmation} onChangeText={setConfirmation}
                  editable={!busy} secureTextEntry={!showConfirmation} autoCapitalize="none" autoCorrect={false}
                  accessibilityLabel="Xác nhận mật khẩu" />
                <TouchableOpacity accessibilityRole="button"
                  accessibilityLabel={showConfirmation ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                  disabled={busy} onPress={() => setShowConfirmation(value => !value)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmation ? 'eye-off-outline' : 'eye-outline'} size={21} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </>}
            {!!error && <Text accessibilityRole="alert" style={{ color: '#b91c1c', marginVertical: 12 }}>{error}</Text>}
            {!!notice && <Text style={{ color: '#15803d', marginVertical: 12 }}>{notice}</Text>}
            <TouchableOpacity disabled={busy} style={[styles.primarySubmitBtn, { marginBottom: 24, opacity: busy ? 0.6 : 1 }]} onPress={() => void submit()}>
              {busy ? <ActivityIndicator color="white" /> : <Text style={styles.primarySubmitBtnText}>{mode === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    <Modal visible={isOnboardingGateOpen} transparent animationType="fade" onRequestClose={() => setIsOnboardingGateOpen(false)}>
      <View style={styles.overlay}><View style={[styles.sheetContainer, { padding: 24 }]}>
        <Text style={styles.modalTitle}>Hoàn thiện hồ sơ bệnh nhân</Text>
        <Text style={styles.gateDescription}>Vui lòng cập nhật họ tên, số điện thoại, ngày sinh, giới tính, địa chỉ và CCCD hoặc BHYT tại mục Tài khoản.</Text>
        <TouchableOpacity style={styles.primarySubmitBtn} onPress={() => { setIsOnboardingGateOpen(false); setActiveTab('profile'); }}><Text style={styles.primarySubmitBtnText}>ĐẾN HỒ SƠ CÁ NHÂN</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setIsOnboardingGateOpen(false)} style={{ padding: 16 }}><Text>Để sau</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </>;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: COLORS.primarySoftBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.amberLight,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    lineHeight: 17,
  },
  tabSwitchRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.white,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMain,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textMain,
    backgroundColor: '#f8fafc',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textMain,
  },
  eyeButton: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  primarySubmitBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  demoQuickSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 8,
  },
  demoQuickTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  demoAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoftBg,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  demoAccountName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  demoAccountSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  gateDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
});
