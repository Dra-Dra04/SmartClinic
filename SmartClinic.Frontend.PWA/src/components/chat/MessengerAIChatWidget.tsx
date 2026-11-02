import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { DoctorSlotChatCard } from './DoctorSlotChatCard';
import { 
  Bot, 
  Send, 
  X, 
  Minus, 
  RotateCcw, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  Maximize2
} from 'lucide-react';

export const MessengerAIChatWidget: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    messages,
    isTyping,
    unreadCount,
    toggleOpen,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    resetConversation,
    sendMessage,
    setFeedback,
    sendPresetPrompt,
  } = useChatStore();

  const [inputVal, setInputVal] = useState('');
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    sendMessage(inputVal.trim());
    setInputVal('');
  };

  const toggleCitation = (msgId: string) => {
    setExpandedCitations((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  // Sample prompt chips for quick demo test
  const quickPrompts = [
    'Tôi bị đau tức vùng thượng vị, hôm nay có bác sĩ nào khám không?',
    'Quy trình nội soi dạ dày không đau cần chuẩn bị gì?',
    'Khám ngoại trú có được thanh toán BHYT trái tuyến không?',
    'Kê đơn giúp tôi thuốc hạ huyết áp'
  ];

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none print:hidden">
      {/* 1. CLOSED FLOATING BUBBLE */}
      {!isOpen && (
        <div className="relative group flex items-center justify-end">
          {/* Greeting Callout Balloon */}
          <div 
            onClick={openChat}
            className="hidden sm:flex items-center gap-2 mr-3 px-3.5 py-2 bg-white rounded-2xl shadow-xl border border-blue-100 text-xs font-semibold text-slate-700 cursor-pointer hover:border-blue-300 transition hover:shadow-2xl animate-bounce duration-1000"
          >
            <span className="w-2 h-2 rounded-full bg-[#0084c7] animate-ping" />
            <span>Hỏi Bác sĩ AI & Đặt lịch RAG</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>

          {/* Main Floating Circle Button */}
          <button
            onClick={openChat}
            aria-label="Mở Trợ lý Y tế AI RAG"
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#005a8b] to-[#0084c7] text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white ring-4 ring-blue-500/20"
          >
            <Bot className="w-7 h-7" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#00a8e8] border-2 border-white" />
          </button>
        </div>
      )}

      {/* 2. MINIMIZED DOCK BAR */}
      {isOpen && isMinimized && (
        <div
          onClick={maximizeChat}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#005a8b] to-[#0084c7] text-white rounded-2xl shadow-2xl cursor-pointer hover:from-[#004a73] hover:to-[#0072bc] transition active:scale-95 border-2 border-white"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-sky-300 border border-blue-800" />
          </div>
          <span className="text-xs font-bold">Trợ lý Y tế Phúc An SmartClinic</span>
          <Maximize2 className="w-4 h-4 ml-2 opacity-80" />
        </div>
      )}

      {/* 3. OPEN MESSENGER-STYLE CHAT WINDOW */}
      {isOpen && !isMinimized && (
        <div className="w-[385px] max-w-[calc(100vw-24px)] h-[580px] max-h-[calc(100vh-100px)] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          
          {/* HEADER (Facebook Messenger Style with Ocean Blue Hospital Palette) */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#005a8b] via-[#0072bc] to-[#0084c7] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-xs border border-white/30 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-sky-400 border-2 border-blue-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">Trợ lý Y tế Phúc An SmartClinic</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-900/80 text-blue-200 border border-blue-400/40">
                    RAG
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
                  Trực tuyến • Phác đồ BYT & Lịch khám HIS
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 text-blue-100">
              <button
                type="button"
                onClick={resetConversation}
                title="Tạo hội thoại mới"
                className="p-1.5 rounded-lg hover:bg-white/20 transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={minimizeChat}
                title="Thu nhỏ xuống thanh dock"
                className="p-1.5 rounded-lg hover:bg-white/20 transition active:scale-95"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={closeChat}
                title="Đóng cửa sổ"
                className="p-1.5 rounded-lg hover:bg-white/20 transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RAG Knowledge Badge Banner */}
          <div className="px-3 py-1.5 bg-blue-50/90 border-b border-blue-100/80 flex items-center justify-between text-[11px] text-[#005a8b] font-medium">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0084c7]" />
              Truy hồi tri thức tự động (Pinecone Vector DB)
            </span>
            <span className="text-[10px] text-[#005a8b] bg-blue-100/80 px-2 py-0.5 rounded-full font-bold">
              4 Tài liệu chuẩn
            </span>
          </div>

          {/* MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 text-slate-800 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isAccordionOpen = expandedCitations[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className={`flex items-end gap-1.5 max-w-[88%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-[#0084c7] text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-xs">
                        AI
                      </div>
                    )}

                    <div
                      className={`p-3 rounded-2xl shadow-xs leading-relaxed ${
                        isUser
                          ? 'bg-[#0084c7] text-white rounded-br-xs'
                          : msg.isMedicalSafeFallback
                          ? 'bg-amber-50/95 border border-amber-300 text-amber-950 rounded-bl-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                      }`}
                    >
                      {/* Safe Fallback Header */}
                      {msg.isMedicalSafeFallback && (
                        <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1.5 pb-1 border-b border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Quy tắc An toàn Dược & Khám bệnh</span>
                        </div>
                      )}

                      {/* Content Formatted */}
                      <div className="whitespace-pre-line">
                        {msg.content}
                      </div>

                      {/* Interactive Doctor & Slot Picker Card inside Chat */}
                      {msg.interactiveType === 'DOCTOR_SLOT_SELECT' && msg.interactiveData && (
                        <DoctorSlotChatCard
                          doctor={msg.interactiveData.doctor!}
                          specialty={msg.interactiveData.specialty}
                          slots={msg.interactiveData.slots || []}
                          date={msg.interactiveData.date || new Date().toISOString().substring(0, 10)}
                        />
                      )}
                    </div>
                  </div>

                  {/* CITATIONS ACCORDION / PILL (For Assistant Messages) */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="w-[88%] ml-7">
                      <button
                        type="button"
                        onClick={() => toggleCitation(msg.id)}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-[#005a8b] bg-blue-100/70 hover:bg-blue-100 px-2 py-1 rounded-lg transition border border-blue-200/60"
                      >
                        <FileText className="w-3 h-3 text-[#0084c7]" />
                        <span>Trích dẫn nguồn ({msg.citations.length} tài liệu RAG)</span>
                        {isAccordionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isAccordionOpen && (
                        <div className="mt-1.5 p-2 bg-white rounded-xl border border-blue-200 text-[11px] text-slate-600 space-y-1.5 shadow-xs animate-in fade-in">
                          {msg.citations.map((cite, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                              <span className="text-[#0084c7] font-mono text-[10px] font-bold">📄</span>
                              <div>
                                <span className="font-semibold text-slate-800">{cite.docTitle}</span>
                                <span className="text-[#0072bc] font-medium"> ({cite.version})</span>
                                {cite.page && <span className="text-slate-500"> • Trang {cite.page}</span>}
                                {cite.section && <span className="text-slate-500"> • {cite.section}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Feedback buttons 👍 / 👎 */}
                      <div className="flex items-center gap-2 mt-1 px-1">
                        <span className="text-[10px] text-slate-400">Câu trả lời có ích?</span>
                        <button
                          type="button"
                          onClick={() => setFeedback(msg.id, 'like')}
                          className={`p-1 rounded hover:bg-slate-200 transition ${msg.feedback === 'like' ? 'text-[#0084c7] font-bold bg-blue-50' : 'text-slate-400'}`}
                          title="Hữu ích"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setFeedback(msg.id, 'dislike')}
                          className={`p-1 rounded hover:bg-slate-200 transition ${msg.feedback === 'dislike' ? 'text-red-500 font-bold bg-red-50' : 'text-slate-400'}`}
                          title="Chưa phù hợp"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <span className="text-[10px] text-slate-400 ml-auto">{msg.timestamp}</span>
                      </div>
                    </div>
                  )}

                  {isUser && (
                    <span className="text-[10px] text-slate-400 mr-1">{msg.timestamp}</span>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator (Facebook Messenger 3-dots style) */}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#0084c7] text-white flex items-center justify-center text-[10px] font-bold">
                  AI
                </div>
                <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-2xl rounded-bl-xs border border-slate-200 shadow-xs">
                  <span className="w-1.5 h-1.5 bg-[#0084c7] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#0084c7] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#0084c7] rounded-full animate-bounce" />
                  <span className="text-[10px] text-[#005a8b] ml-1 font-medium">Đang truy hồi RAG...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT SUGGESTION CHIPS */}
          <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendPresetPrompt(prompt)}
                className="flex-shrink-0 text-[11px] font-medium text-[#005a8b] bg-blue-50 hover:bg-blue-100 hover:text-[#004a73] border border-blue-200 px-2.5 py-1 rounded-full transition active:scale-95 truncate max-w-[200px]"
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Mô tả triệu chứng hoặc hỏi quy trình khám..."
              className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0084c7]/40 focus:bg-white text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isTyping}
              className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition ${
                inputVal.trim() && !isTyping
                  ? 'bg-[#0084c7] hover:bg-[#0072bc] text-white shadow-md active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};
