import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BotIcon } from '../components/BotIcon';
import { COLORS } from '../theme/colors';
import { useMobileApp } from '../context/MobileAppContext';
import { MobileChatMessage } from '../types';

const INITIAL_MESSAGES: MobileChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    content:
      'Xin chào! Tôi là Trợ lý Y tế AI Phúc An SmartClinic (RAG).\n\nTôi được kết nối với cơ sở dữ liệu Phác đồ Bộ Y Tế, quy trình kỹ thuật và lịch trực Bác sĩ HIS. Bạn đang có triệu chứng cần tư vấn chuyên khoa hay muốn tra cứu thủ tục khám?',
    timestamp: '09:40',
    citations: [
      {
        docTitle: 'Hệ thống Quản lý Bệnh viện Thông minh Phúc An HIS',
        version: 'v2026.1',
        section: 'Mục 1.0 - Tư vấn phân luồng lâm sàng RAG',
      },
    ],
  },
];

const QUICK_PROMPTS = [
  'Tôi bị đau tức vùng thượng vị, hôm nay bác sĩ nào khám?',
  'Nội soi dạ dày không đau cần chuẩn bị gì?',
  'Khám ngoại trú có được hưởng BHYT thông tuyến không?',
  'Kê đơn giúp tôi thuốc hạ huyết áp',
];

export const AIChatScreen: React.FC = () => {
  const { doctors, timeSlots, requestStartBooking, setActiveTab } = useMobileApp();
  const [messages, setMessages] = useState<MobileChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedCiteIds, setExpandedCiteIds] = useState<Record<string, boolean>>({});

  const toggleCitation = (id: string) => {
    setExpandedCiteIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSendMessage = (customPrompt?: string) => {
    const text = (customPrompt ?? inputText).trim();
    if (!text) return;

    const userMsg: MobileChatMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let reply: MobileChatMessage;

      if (doctors.length === 0) {
        reply = { id: 'msg-ai-' + Date.now(), sender: 'assistant', content: 'Chưa có danh sách bác sĩ. Bạn có thể mở mục Tìm Bác sĩ để tải lại thông tin và xem lịch khám thực tế.', timestamp: 'Vừa xong' };
      } else if (
        lower.includes('đau tức') ||
        lower.includes('thượng vị') ||
        lower.includes('dạ dày') ||
        lower.includes('tiêu hóa') ||
        lower.includes('bác sĩ nào')
      ) {
        const doc = doctors[0];
        reply = {
          id: 'msg-ai-' + Date.now(),
          sender: 'assistant',
          content: `Dựa trên triệu chứng đau tức vùng thượng vị, hệ thống khuyến nghị bạn nên thăm khám tại ${doc.specialtyName} để tầm soát viêm loét dạ dày - tá tràng hoặc trào ngược GERD.\n\nHôm nay ${doc.title} ${doc.fullName} đang có lịch trực tại ${doc.roomNumber}. Bạn có thể nhấn đặt lịch ngay bên dưới:`,
          timestamp: 'Vừa xong',
          recommendedDoctorId: doc.id,
          citations: [
            {
              docTitle: 'Phác đồ Chẩn đoán & Điều trị Viêm loét Dạ dày BYT',
              version: 'v3.0',
              section: 'Mục 2.3 - Triệu chứng vùng thượng vị',
            },
            {
              docTitle: 'Lịch trực Bác sĩ Chuyên khoa BV Đa khoa Quốc tế Phúc An',
              version: '2026',
              section: doc.specialtyName,
            },
          ],
        };
      } else if (
        lower.includes('kê đơn') ||
        lower.includes('thuốc gì') ||
        lower.includes('mua thuốc')
      ) {
        reply = {
          id: 'msg-ai-' + Date.now(),
          sender: 'assistant',
          content:
            'CẢNH BÁO AN TOÀN DƯỢC LÂM SÀNG (Safe Fallback):\n\nTrợ lý AI tuân thủ nghiêm ngặt quy định của Bộ Y Tế: Tuyệt đối không tự ý kê đơn thuốc hạ áp, kháng sinh hay giảm đau qua chat khi chưa có bác sĩ khám trực tiếp.\n\nVui lòng đặt lịch khám để Bác sĩ đo huyết áp, điện tim và kê đơn an toàn trên hệ thống EMR!',
          timestamp: 'Vừa xong',
          isMedicalSafeFallback: true,
          citations: [
            {
              docTitle: 'Thông tư 52/2017/TT-BYT về Kê đơn thuốc ngoại trú',
              version: 'Bộ Y Tế',
              section: 'Điều 4 - Nguyên tắc an toàn kê đơn',
            },
          ],
        };
      } else if (lower.includes('nội soi') || lower.includes('chuẩn bị')) {
        reply = {
          id: 'msg-ai-' + Date.now(),
          sender: 'assistant',
          content:
            'Theo Quy trình Nội soi Tiêu hóa NBI không đau tại BV Đa khoa Quốc tế Phúc An:\n\n1. Nhịn ăn tối thiểu 6 giờ trước khi nội soi.\n2. Không uống sữa, cà phê hoặc nước có màu.\n3. Thông báo cho bác sĩ nếu đang dùng thuốc chống đông máu hoặc tiểu đường.\n4. Nếu nội soi tiền mê, nên có người thân đi cùng.',
          timestamp: 'Vừa xong',
          citations: [
            {
              docTitle: 'Quy trình Kỹ thuật Nội soi NBI & Tiền mê An toàn',
              version: 'v2.1',
              section: 'Hướng dẫn chuẩn bị bệnh nhân',
            },
          ],
        };
      } else if (lower.includes('bhyt') || lower.includes('bảo hiểm')) {
        reply = {
          id: 'msg-ai-' + Date.now(),
          sender: 'assistant',
          content:
            'Theo Chính sách BHYT Ngoại trú 2026 tại BV Đa khoa Quốc tế Phúc An:\n\n• Hưởng 100% quyền lợi thông tuyến toàn quốc trên mức hưởng của thẻ (80% - 95% - 100%).\n• Chỉ cần mang theo CCCD gắn chip hoặc mở ứng dụng VNeID / VssID tại quầy tiếp đón.',
          timestamp: 'Vừa xong',
          citations: [
            {
              docTitle: 'Quy định Thanh toán BHYT Thông tuyến tại Bệnh viện',
              version: 'v2.0',
              section: 'Mục 1.2 - Quyền lợi người bệnh BHYT',
            },
          ],
        };
      } else {
        const doc = doctors[1] || doctors[0];
        reply = {
          id: 'msg-ai-' + Date.now(),
          sender: 'assistant',
          content:
            'Hệ thống RAG BV Đa khoa Quốc tế Phúc An đã ghi nhận câu hỏi của bạn.\n\n• Bệnh viện làm việc từ 07:30 - 17:00 (Thứ 2 - Thứ 7), Cấp cứu trực 24/7.\n• Bạn có thể chọn nhanh bác sĩ chuyên khoa bên dưới để đặt lịch khám ưu tiên không chờ đợi:',
          timestamp: 'Vừa xong',
          recommendedDoctorId: doc.id,
          citations: [
            {
              docTitle: 'Cẩm nang Hướng dẫn Khám chữa bệnh Phúc An',
              version: 'v4.0',
              section: 'Chương 1 - Quy trình tiếp đón',
            },
          ],
        };
      }

      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 650);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 1. AI Assistant Header Banner */}
      <View style={styles.aiHeader}>
        <View style={styles.aiHeaderLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.botAvatar}>
            <BotIcon size={24} color={COLORS.white} />
            <View style={styles.onlineDot} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.aiTitle}>Trợ lý Y tế AI Phúc An</Text>
            </View>
            <Text style={styles.aiSubtitle}>
              Hỗ trợ thông tin sức khỏe và đặt lịch
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => setMessages(INITIAL_MESSAGES)}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* 3. Chat Messages Area */}
      <ScrollView
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const recommendedDoc = msg.recommendedDoctorId
            ? doctors.find((d) => d.id === msg.recommendedDoctorId)
            : undefined;
          const citeExpanded = !!expandedCiteIds[msg.id];

          return (
            <View
              key={msg.id}
              style={[
                styles.msgRow,
                isUser ? styles.msgRowUser : styles.msgRowAssistant,
              ]}
            >
              {!isUser && (
                <View style={styles.msgBotCircle}>
                  <BotIcon size={18} color={COLORS.white} />
                </View>
              )}

              <View style={styles.msgBubbleWrap}>
                <View
                  style={[
                    styles.msgBubble,
                    isUser
                      ? styles.msgBubbleUser
                      : msg.isMedicalSafeFallback
                      ? styles.msgBubbleFallback
                      : styles.msgBubbleAssistant,
                  ]}
                >
                  {msg.isMedicalSafeFallback && (
                    <View style={styles.fallbackHeader}>
                      <Ionicons name="warning" size={14} color="#b45309" />
                      <Text style={styles.fallbackHeaderText}>
                        Quy tắc An toàn Dược & Khám bệnh
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.msgText,
                      isUser && styles.msgTextUser,
                      msg.isMedicalSafeFallback && styles.msgTextFallback,
                    ]}
                  >
                    {msg.content}
                  </Text>

                  {/* Interactive Doctor & Slot Card inside AI Chat */}
                  {recommendedDoc && (
                    <View style={styles.docSuggestCard}>
                      <View style={styles.docSuggestTop}>
                        <View style={styles.docBadgeIcon}>
                          <Ionicons name="medkit" size={16} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docSuggestName}>
                            {recommendedDoc.title} {recommendedDoc.fullName}
                          </Text>
                          <Text style={styles.docSuggestSpec}>
                            {recommendedDoc.specialtyName} • {recommendedDoc.roomNumber}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.slotChipsRow}>
                        {timeSlots.slice(0, 3).map((slot) => (
                          <TouchableOpacity
                            key={slot.id}
                            style={styles.slotChip}
                            onPress={() => requestStartBooking(recommendedDoc)}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.slotChipText}>{slot.timeRange}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={styles.bookNowFromChatBtn}
                        onPress={() => requestStartBooking(recommendedDoc)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="calendar" size={14} color={COLORS.white} />
                        <Text style={styles.bookNowFromChatText}>
                          Đặt lịch khám với Bác sĩ ngay
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* RAG Citations Toggle */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <View style={styles.citeContainer}>
                    <TouchableOpacity
                      style={styles.citeToggleBtn}
                      onPress={() => toggleCitation(msg.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={12}
                        color={COLORS.primaryDark}
                      />
                      <Text style={styles.citeToggleText}>
                        Trích dẫn nguồn ({msg.citations.length} tài liệu RAG)
                      </Text>
                      <Ionicons
                        name={citeExpanded ? 'chevron-up' : 'chevron-down'}
                        size={12}
                        color={COLORS.primaryDark}
                      />
                    </TouchableOpacity>

                    {citeExpanded && (
                      <View style={styles.citeBox}>
                        {msg.citations.map((c, idx) => (
                          <Text key={idx} style={styles.citeItemText}>
                            📄 {c.docTitle} ({c.version}) • {c.section}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                <Text
                  style={[
                    styles.timestampText,
                    isUser && { alignSelf: 'flex-end' },
                  ]}
                >
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={styles.typingWrap}>
            <View style={styles.msgBotCircle}>
              <BotIcon size={18} color={COLORS.white} />
            </View>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>Đang chuẩn bị câu trả lời...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 4. Quick Suggestion Chips */}
      <View style={styles.promptsBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsScroll}
        >
          {QUICK_PROMPTS.map((prompt, index) => (
            <TouchableOpacity
              key={index}
              style={styles.promptChip}
              onPress={() => handleSendMessage(prompt)}
              activeOpacity={0.8}
            >
              <Text style={styles.promptChipText} numberOfLines={1}>
                {prompt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Mô tả triệu chứng hoặc hỏi quy trình khám..."
          placeholderTextColor={COLORS.textMuted}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            !inputText.trim() && styles.sendBtnDisabled,
          ]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={16} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  aiHeader: {
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  aiSubtitle: {
    color: '#bae6fd',
    fontSize: 12,
    marginTop: 1,
  },
  resetBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    gap: 12,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
  },
  msgBotCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  msgBotCircleText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },
  msgBubbleWrap: {
    maxWidth: '84%',
  },
  msgBubble: {
    padding: 11,
    borderRadius: 16,
  },
  msgBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleAssistant: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  msgBubbleFallback: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderBottomLeftRadius: 4,
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  fallbackHeaderText: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '800',
  },
  msgText: {
    color: COLORS.textMain,
    fontSize: 14,
    lineHeight: 22,
  },
  msgTextUser: {
    color: COLORS.white,
  },
  msgTextFallback: {
    color: '#78350f',
  },
  docSuggestCard: {
    marginTop: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  docSuggestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  docBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docSuggestName: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  docSuggestSpec: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  slotChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  slotChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#7dd3fc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  slotChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  bookNowFromChatBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  bookNowFromChatText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  citeContainer: {
    marginTop: 5,
  },
  citeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  citeToggleText: {
    color: COLORS.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  citeBox: {
    marginTop: 4,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 3,
  },
  citeItemText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingBubble: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  promptsBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingVertical: 7,
  },
  promptsScroll: {
    paddingHorizontal: 10,
    gap: 6,
  },
  promptChip: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    maxWidth: 220,
  },
  promptChipText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '600',
  },
  inputBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textMain,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
