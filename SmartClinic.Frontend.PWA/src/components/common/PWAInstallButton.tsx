import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, display a discreet badge or return null
  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        PWA Đã cài đặt
      </span>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-lg shadow-sm transition active:scale-95"
        title="Cài đặt SmartClinic PWA trên màn hình chính"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Cài App PWA</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition active:scale-95"
          title="Hướng dẫn cài trên iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Cài trên iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Cài đặt SmartClinic PWA</h3>
                    <p className="text-xs text-slate-500">Dành cho iPhone & iPad</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                  <p>Nhấn vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh dưới cùng trình duyệt Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                  <p>Cuộn xuống và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">3</span>
                  <p>Nhấn <strong>Thêm (Add)</strong> ở góc trên bên phải để hoàn tất cài đặt.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
              >
                Đã hiểu, đóng hướng dẫn
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback demo button for preview testing if neither triggered
  return (
    <button
      onClick={() => alert('Ứng dụng đã sẵn sàng chuẩn PWA! Trong trình duyệt Chrome/Edge/Mobile, bạn có thể nhấn Cài đặt ứng dụng tại thanh địa chỉ hoặc Menu trình duyệt.')}
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
    >
      <Download className="w-3.5 h-3.5 text-emerald-600" />
      <span>PWA Sẵn sàng</span>
    </button>
  );
};
