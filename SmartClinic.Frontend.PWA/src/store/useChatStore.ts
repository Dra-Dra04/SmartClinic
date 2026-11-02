import { create } from 'zustand';
import { ChatMessage, Specialty, Doctor, TimeSlot } from '../types';
import { SPECIALTIES_DATA, DOCTORS_DATA, TIME_SLOTS_DATA } from '../services/mockData';

interface ChatState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  selectedChatSlot: string | null;
  selectedChatDoctor: Doctor | null;
  unreadCount: number;

  // Actions
  toggleOpen: () => void;
  openChat: () => void;
  closeChat: () => void;
  minimizeChat: () => void;
  maximizeChat: () => void;
  resetConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  selectSlotInChat: (time: string, doctor: Doctor) => void;
  setFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
  sendPresetPrompt: (promptText: string) => void;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'msg_welcome',
  sender: 'assistant',
  content: 'Xin chào! Tôi là **Trợ lý Y tế SmartClinic (RAG)**. Tôi được huấn luyện trên cơ sở dữ liệu phác đồ Bộ Y Tế, quy trình kỹ thuật phòng khám và danh mục bác sĩ chuyên khoa.\n\nBạn đang có triệu chứng cần tư vấn chuyên khoa hay cần tra cứu quy trình khám?',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  citations: [
    {
      docTitle: 'Hệ thống Quản lý Phòng khám Thông minh SmartClinic HIS',
      version: 'v2026.1',
      section: 'Mục 1.0 - Giới thiệu Trợ lý Y tế RAG',
    },
  ],
};

export const useChatStore = create<ChatState>((set, get) => ({
  isOpen: false,
  isMinimized: false,
  messages: [INITIAL_GREETING],
  isTyping: false,
  selectedChatSlot: null,
  selectedChatDoctor: null,
  unreadCount: 1,

  toggleOpen: () => {
    set((state) => ({
      isOpen: !state.isOpen,
      isMinimized: false,
      unreadCount: state.isOpen ? state.unreadCount : 0,
    }));
  },

  openChat: () => {
    set({ isOpen: true, isMinimized: false, unreadCount: 0 });
  },

  closeChat: () => {
    set({ isOpen: false });
  },

  minimizeChat: () => {
    set((state) => ({ isMinimized: !state.isMinimized }));
  },

  maximizeChat: () => {
    set({ isMinimized: false, isOpen: true });
  },

  resetConversation: () => {
    set({
      messages: [INITIAL_GREETING],
      selectedChatSlot: null,
      selectedChatDoctor: null,
      isTyping: false,
    });
  },

  selectSlotInChat: (time: string, doctor: Doctor) => {
    set({
      selectedChatSlot: time,
      selectedChatDoctor: doctor,
    });
  },

  setFeedback: (messageId: string, feedback: 'like' | 'dislike') => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, feedback } : m
      ),
    }));
  },

  sendPresetPrompt: (promptText: string) => {
    get().openChat();
    get().sendMessage(promptText);
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_user_' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isTyping: true,
      selectedChatSlot: null,
    }));

    // Simulate RAG vector retrieval & response latency
    await new Promise((resolve) => setTimeout(resolve, 900));

    const lower = text.toLowerCase();
    let replyMsg: ChatMessage;

    // SCENARIO 1: Symptom inquiry -> Rich Doctor & TimeSlot interactive cards (Function Calling UI)
    if (lower.includes('đau tức') || lower.includes('thượng vị') || lower.includes('dạ dày') || lower.includes('bác sĩ nào khám') || lower.includes('tiêu hóa')) {
      const doc = DOCTORS_DATA[0]; // BS.CKII Nguyễn Minh Tuấn
      const spec = SPECIALTIES_DATA[0]; // Khoa Tiêu hóa

      replyMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: `Dựa trên triệu chứng **đau tức vùng thượng vị**, hệ thống khuyến nghị bạn nên thăm khám tại **${spec.name}** để loại trừ các bệnh lý viêm loét dạ dày - tá tràng hoặc trào ngược thực quản (GERD).\n\nHôm nay, **${doc.title} ${doc.fullName}** đang có lịch trực khám tại **${doc.roomNumber}**. Dưới đây là các khung giờ còn trống trong ngày, bạn có thể chọn giờ và xác nhận đặt lịch trực tiếp ngay bên dưới:`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: [
          {
            docTitle: 'Phác đồ Chẩn đoán và Điều trị Viêm loét Dạ dày - Tá tràng BYT',
            version: 'v3.0',
            page: 12,
            section: 'Mục 2.3 - Triệu chứng lâm sàng vùng thượng vị',
          },
          {
            docTitle: 'Lịch công tác Chuyên gia Phòng khám Đa khoa SmartClinic',
            version: 'Tuần 44/2026',
            section: 'Khoa Tiêu hóa - Gan mật',
          },
        ],
        interactiveType: 'DOCTOR_SLOT_SELECT',
        interactiveData: {
          specialty: spec,
          doctor: doc,
          slots: TIME_SLOTS_DATA,
          date: new Date().toISOString().substring(0, 10),
        },
      };
    } 
    // SCENARIO 2: Safe Fallback (Asking for medical prescription without doctor visit)
    else if (lower.includes('kê đơn') || lower.includes('uống thuốc gì') || lower.includes('đơn thuốc') || lower.includes('mua thuốc')) {
      replyMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: `**CẢNH BÁO AN TOÀN Y TẾ TỪ TRỢ LÝ AI (Safe Fallback):**\n\nTrợ lý AI SmartClinic tuân thủ nghiêm ngặt quy định của Bộ Y Tế: **Tuyệt đối không tự ý kê đơn thuốc hoặc chỉ định liều lượng điều trị qua chat** khi chưa có sự thăm khám trực tiếp từ bác sĩ chuyên khoa.\n\nViệc tự ý dùng thuốc hạ áp, kháng sinh hay giảm đau có thể che lấp dấu hiệu bệnh lý nguy hiểm và gây biến chứng nghiêm trọng. Vui lòng đặt lịch khám để được bác sĩ đo huyết áp, làm xét nghiệm và kê đơn phù hợp với thể trạng của bạn!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        isMedicalSafeFallback: true,
        citations: [
          {
            docTitle: 'Thông tư số 52/2017/TT-BYT Quy định về Đơn thuốc & Kê đơn thuốc ngoại trú',
            version: 'Bộ Y Tế',
            page: 3,
            section: 'Điều 4 - Nguyên tắc kê đơn thuốc an toàn',
          },
        ],
      };
    } 
    // SCENARIO 3: Endoscopy Preparation Procedure
    else if (lower.includes('nội soi') || lower.includes('chuẩn bị') || lower.includes('nhịn ăn')) {
      replyMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: `Theo **Quy trình Kỹ thuật Nội soi Tiêu hóa êm ái v2.1** tại SmartClinic, bạn cần lưu ý các bước chuẩn bị sau:\n\n1. **Nhịn ăn:** Nhịn ăn tuyệt đối ít nhất **6 giờ** trước khi nội soi (đối với nội soi dạ dày) hoặc dùng thuốc làm sạch đại tràng (đối với nội soi đại tràng).\n2. **Uống nước:** Có thể uống nước lọc một lượng nhỏ trước 2 giờ, không uống sữa hay nước ngọt có màu.\n3. **Thuốc đang dùng:** Báo ngay cho bác sĩ nếu đang uống thuốc chống đông máu (Aspirin, Clopidogrel), hạ áp hoặc tiểu đường.\n4. **Nội soi không đau (tiền mê):** Người bệnh cần có người nhà đi cùng để hỗ trợ đưa về sau khi hết thuốc mê.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: [
          {
            docTitle: 'Quy trình Kỹ thuật Nội soi Tiêu hóa êm ái & Chuẩn bị người bệnh',
            version: 'v2.1',
            page: 4,
            section: 'Mục 2.1 - Hướng dẫn chuẩn bị trước thủ thuật',
          },
          {
            docTitle: 'Tiêu chuẩn An toàn Tiền mê Propofol trong Thăm dò Chức năng',
            version: 'v1.5',
            section: 'Chỉ định & Chống chỉ định',
          },
        ],
      };
    } 
    // SCENARIO 4: Health Insurance (BHYT) Policies
    else if (lower.includes('bhyt') || lower.includes('bảo hiểm') || lower.includes('trái tuyến') || lower.includes('thông tuyến')) {
      replyMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: `Theo **Chính sách BHYT Ngoại trú 2026** tại SmartClinic:\n\n- Phòng khám Đa khoa SmartClinic thuộc tuyến huyện/quận hạng III, áp dụng **thông tuyến BHYT toàn quốc** cho khám ngoại trú.\n- Bạn được hưởng **100% mức quyền lợi ghi trên thẻ BHYT** (80%, 95% hoặc 100% tùy mã đối tượng) mà **không cần giấy chuyển tuyến**.\n- Khi đến khám, bạn chỉ cần xuất trình **CCCD gắn chip** đã tích hợp thông tin thẻ BHYT trên ứng dụng VNeID mức độ 2 hoặc thẻ BHYT điện tử VssID.`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: [
          {
            docTitle: 'Quy định Khám chữa bệnh & Thanh toán BHYT Ngoại trú tại Phòng khám',
            version: 'v2.0',
            page: 2,
            section: 'Mục 1.2 - Chính sách thông tuyến khám chữa bệnh',
          },
        ],
      };
    } 
    // SCENARIO 5: Cardiology / Blood pressure inquiry
    else if (lower.includes('tim mạch') || lower.includes('huyết áp') || lower.includes('đánh trống ngực') || lower.includes('khó thở')) {
      const doc = DOCTORS_DATA[1]; // PGS.TS Lê Thị Quỳnh Trang
      const spec = SPECIALTIES_DATA[1]; // Tim mạch

      replyMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: `Với các dấu hiệu hồi hộp, đánh trống ngực hoặc huyết áp dao động, bạn nên kiểm tra chuyên khoa **${spec.name}** để được đo điện tim ECG và siêu âm tim Doppler màu.\n\nHiện tại chuyên gia hàng đầu **${doc.title} ${doc.fullName}** đang nhận lịch khám hôm nay:`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: [
          {
            docTitle: 'Khuyến cáo của Hội Tim Mạch Việt Nam về Kiểm soát Tăng Huyết Áp',
            version: '2024',
            page: 8,
            section: 'Mục 3.1 - Tầm soát tổn thương cơ quan đích',
          },
        ],
        interactiveType: 'DOCTOR_SLOT_SELECT',
        interactiveData: {
          specialty: spec,
          doctor: doc,
          slots: TIME_SLOTS_DATA,
          date: new Date().toISOString().substring(0, 10),
        },
      };
    }
    // DEFAULT SCENARIO
    else {
      replyMsg = {
        id: 'msg_ai_' + Date.now(),
        sender: 'assistant',
        content: `Cảm ơn câu hỏi của bạn. Hệ thống RAG SmartClinic đã tra cứu kho tri thức y khoa nội bộ và xác nhận:\n\n- Phòng khám tiếp nhận bệnh nhân liên tục từ **07:30 đến 17:00** (tất cả các ngày trong tuần).\n- Có đầy đủ các chuyên khoa: Tiêu hóa, Tim mạch, Tai Mũi Họng, Thần kinh, Cơ xương khớp, Nhi khoa...\n- Bạn có thể bấm chọn nhanh các gợi ý câu hỏi bên dưới hoặc mô tả chi tiết hơn về tình trạng sức khỏe để tôi hỗ trợ kết nối đúng bác sĩ chuyên khoa!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        citations: [
          {
            docTitle: 'Cẩm nang Hướng dẫn Bệnh nhân & Dịch vụ Phòng khám Đa khoa SmartClinic',
            version: 'v4.0',
            section: 'Chương 1 - Giờ làm việc & Khung thời gian phục vụ',
          },
        ],
      };
    }

    set((state) => ({
      messages: [...state.messages, replyMsg],
      isTyping: false,
    }));
  },
}));
