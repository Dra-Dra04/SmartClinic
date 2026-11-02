import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useClinicStore } from '../../store/useClinicStore';
import { CLINICAL_SERVICES_CATALOG, MEDICINES_CATALOG, SPECIALTIES_DATA } from '../../services/mockData';
import { PrescriptionItem, ClinicalOrder } from '../../types';
import { 
  Stethoscope, 
  Scan, 
  Activity, 
  FileText, 
  Pill, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  Printer, 
  Send, 
  Check, 
  Upload, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  QrCode
} from 'lucide-react';

export const DoctorWorkspace: React.FC = () => {
  const { activeDoctorId, setActiveDoctorId } = useAuthStore();
  const { 
    visits, 
    selectedPatientVisitId, 
    setSelectedPatientVisitId, 
    updateVitalSigns, 
    updateEmrDiagnosis, 
    createClinicalOrder, 
    createPrescription, 
    editCompletedEmrOrPrescription, 
    createDepartmentReferral,
    acceptClinicalOrder, 
    submitSubclinicalResult 
  } = useClinicStore();

  // Active patient for DOC-01
  const selectedVisit = visits.find((v) => v.id === selectedPatientVisitId) || visits[0];

  // DOC-01 Sub-tabs: 1. Vitals/Clinical, 2. Clinical Orders, 3. Prescription & Conclusion
  const [doc1SubTab, setDoc1SubTab] = useState<'vitals' | 'orders' | 'prescription'>('vitals');
  
  // Left Column Queue Tab for DOC-01: 'waiting' | 'subclinical' | 'results_ready'
  const [queueTab, setQueueTab] = useState<'waiting' | 'subclinical' | 'results_ready'>('waiting');

  // Vitals State
  const [vitals, setVitals] = useState({
    heightCm: selectedVisit?.emr?.vitalSigns.heightCm || 172,
    weightKg: selectedVisit?.emr?.vitalSigns.weightKg || 69,
    pulseBpm: selectedVisit?.emr?.vitalSigns.pulseBpm || 78,
    systolicBp: selectedVisit?.emr?.vitalSigns.systolicBp || 120,
    diastolicBp: selectedVisit?.emr?.vitalSigns.diastolicBp || 80,
    temperatureC: selectedVisit?.emr?.vitalSigns.temperatureC || 36.8,
    spo2Percent: selectedVisit?.emr?.vitalSigns.spo2Percent || 99,
  });

  const heightM = (vitals.heightCm || 170) / 100;
  const bmiVal = vitals.weightKg / (heightM * heightM);
  const bmiCategory = bmiVal < 18.5 ? 'Gầy' : bmiVal < 24.9 ? 'Bình thường (WHO)' : bmiVal < 29.9 ? 'Tiền béo phì' : 'Béo phì';

  // EMR Clinical Form State
  const [prelimDiagnosis, setPrelimDiagnosis] = useState(selectedVisit?.emr?.preliminaryDiagnosis || 'Trào ngược dạ dày thực quản (GERD)');
  const [icd10, setIcd10] = useState(selectedVisit?.emr?.icd10Code || 'K21.9 / K29.5');
  const [conclusion, setConclusion] = useState(selectedVisit?.emr?.conclusion || 'Chờ kết quả X-quang ngực thẳng từ Khoa CĐHA để loại trừ nguyên nhân tim phổi trước khi kê toa.');

  // Clinical Order Form Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [chosenServiceCode, setChosenServiceCode] = useState(CLINICAL_SERVICES_CATALOG[0].code);
  const [orderReason, setOrderReason] = useState('Đau rát vùng thượng vị lan lên ngực, loại trừ tổn thương tim phổi');

  // Prescription State
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([
    {
      id: 'rx_1',
      medicineName: 'Nexium (Esomeprazole 40mg)',
      dosage: '40mg',
      unit: 'Viên',
      quantity: 28,
      schedule: { morning: '1 viên' },
      instructions: 'Uống 1 viên trước bữa ăn sáng 30 phút',
    },
    {
      id: 'rx_2',
      medicineName: 'Phosphalugel (Gel nhôm phosphat 20g)',
      dosage: '20g',
      unit: 'Gói',
      quantity: 30,
      schedule: { noon: '1 gói', evening: '1 gói' },
      instructions: 'Uống 1 gói khi đau rát thượng vị hoặc sau bữa ăn 2 giờ',
    },
  ]);
  const [rxAdvice, setRxAdvice] = useState('Ăn đúng giờ, tránh đồ cay nóng và rượu bia. Tái khám sau 14 ngày.');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEditEmrModal, setShowEditEmrModal] = useState(false);
  const [editEmrReason, setEditEmrReason] = useState('');
  const [newEditDiagnosis, setNewEditDiagnosis] = useState('');

  // Referral Modal
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [refDept, setRefDept] = useState('Khoa Nội Thần Kinh');
  const [refReason, setRefReason] = useState('Khám kết hợp đau đầu và mất ngủ mạn tính');

  // DOC-02 Imaging Form State
  const allSubclinicalOrders = visits.flatMap(v => v.emr?.clinicalOrders || []);
  const [selectedImagingOrderId, setSelectedImagingOrderId] = useState<string>(allSubclinicalOrders[0]?.id || 'ord_xray_01');
  const [findingsText, setFindingsText] = useState('Hai phế trường sáng đều, không thấy tổn thương thâm nhiễm nhu mô phổi. Cung sườn bình thường, bóng tim không to, chỉ số tim/lồng ngực < 0.5.');
  const [imagingConclusion, setImagingConclusion] = useState('Hình ảnh tim phổi thẳng hiện chưa phát hiện bất thường rõ rệt.');
  const [sampleXrayUrl, setSampleXrayUrl] = useState('https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=700&q=80');

  // Handlers for DOC-01
  const handleSaveVitals = () => {
    if (!selectedVisit) return;
    updateVitalSigns(
      selectedVisit.id,
      { ...vitals, bmi: bmiVal, bmiCategory },
      'BS.CKII Nguyễn Minh Tuấn'
    );
    alert('Đã cập nhật chỉ số sinh tồn và BMI bệnh nhân vào EMR!');
  };

  const handleSaveDiagnosis = () => {
    if (!selectedVisit) return;
    updateEmrDiagnosis(selectedVisit.id, prelimDiagnosis, icd10, conclusion, 'BS.CKII Nguyễn Minh Tuấn');
    alert('Đã lưu chẩn đoán và hướng xử trí EMR!');
  };

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;
    const serv = CLINICAL_SERVICES_CATALOG.find(s => s.code === chosenServiceCode)!;
    createClinicalOrder(
      selectedVisit.id,
      serv.name,
      serv.code,
      serv.department,
      orderReason,
      'DOC-01',
      'BS.CKII Nguyễn Minh Tuấn'
    );
    setIsOrderModalOpen(false);
    setDoc1SubTab('orders');
    alert(`Đã phát hành phiếu chỉ định sang ${serv.department}! Trạng thái chuyển sang "Đang đi Cận lâm sàng".`);
  };

  const handleCompletePrescription = () => {
    if (!selectedVisit) return;
    createPrescription(
      selectedVisit.id,
      {
        visitId: selectedVisit.id,
        patientName: selectedVisit.patientName,
        doctorName: 'BS.CKII Nguyễn Minh Tuấn',
        diagnosis: prelimDiagnosis,
        icd10Code: icd10,
        items: rxItems,
        doctorAdvice: rxAdvice,
        reExamDate: '2026-11-14',
      },
      'BS.CKII Nguyễn Minh Tuấn'
    );
    alert('Đã hoàn tất ca khám và lưu Đơn thuốc điện tử!');
  };

  const handleConfirmEditEmr = () => {
    if (!selectedVisit || !editEmrReason.trim()) {
      alert('Bắt buộc phải nhập Lý do chỉnh sửa để ghi vào Nhật ký Kiểm toán Audit Logs!');
      return;
    }
    editCompletedEmrOrPrescription(selectedVisit.id, newEditDiagnosis || prelimDiagnosis, editEmrReason, 'BS.CKII Nguyễn Minh Tuấn');
    setShowEditEmrModal(false);
    setEditEmrReason('');
    alert('Đã cập nhật bệnh án và ghi lại lịch sử chỉnh sửa vào Audit Logs!');
  };

  // Filter queues for DOC-01
  const doc1Visits = visits.filter(v => v.doctorId === 'DOC-01');
  const waitingVisits = doc1Visits.filter(v => v.status === 'WAITING_EXAM' || v.status === 'IN_EXAM_PRIMARY');
  const subclinicalVisits = doc1Visits.filter(v => v.status === 'AWAITING_SUBCLINICAL');
  const resultsReadyVisits = doc1Visits.filter(v => v.status === 'RESULTS_READY');

  return (
    <div className="space-y-6 text-xs animate-in fade-in">
      
      {/* =========================================================================
          NGỮ CẢNH 5A: BÁC SĨ KHÁM CHÍNH (DOC-01 - BS.CKII Nguyễn Minh Tuấn)
         ========================================================================= */}
      {activeDoctorId === 'DOC-01' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CỘT TRÁI (30% MÀN HÌNH - 4 COLS): HÀNG CHỜ CÁ NHÂN CỦA DOC-01 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hàng Chờ Phòng 102</h3>
                  <p className="text-[10px] text-slate-500">BS.CKII Nguyễn Minh Tuấn</p>
                </div>
                <span className="font-mono font-bold text-[#005a8b] bg-blue-100 px-2 py-0.5 rounded text-xs">
                  {doc1Visits.length} bệnh nhân
                </span>
              </div>

              {/* 3 Tab lọc rõ ràng: 1. Chờ khám, 2. Đi CLS, 3. Đã có kết quả */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                <button
                  onClick={() => setQueueTab('waiting')}
                  className={`py-1.5 rounded-lg transition ${
                    queueTab === 'waiting' ? 'bg-white text-[#005a8b] shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Chờ khám ({waitingVisits.length})
                </button>
                <button
                  onClick={() => setQueueTab('subclinical')}
                  className={`py-1.5 rounded-lg transition ${
                    queueTab === 'subclinical' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Đi CLS ({subclinicalVisits.length})
                </button>
                <button
                  onClick={() => setQueueTab('results_ready')}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                    queueTab === 'results_ready' ? 'bg-purple-600 text-white shadow-2xs' : 'text-purple-700 font-extrabold'
                  }`}
                >
                  <span>Có KQ ({resultsReadyVisits.length})</span>
                  {resultsReadyVisits.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              </div>

              {/* Patient List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {(queueTab === 'waiting' ? waitingVisits : queueTab === 'subclinical' ? subclinicalVisits : resultsReadyVisits).map((v) => {
                  const isSelected = v.id === selectedVisit?.id;
                  const hasResults = v.status === 'RESULTS_READY';

                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedPatientVisitId(v.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'border-[#0084c7] bg-blue-50/80 ring-1 ring-blue-300 shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black font-mono text-[#005a8b] text-sm">{v.visitCode}</span>
                        <span className="text-[10px] text-slate-400">{v.checkInTime}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{v.patientName}</h4>
                      <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{v.emr?.chiefComplaint || 'Khám nội tiêu hóa'}</p>

                      {/* Purple Badge Notification for Results Ready */}
                      {hasResults && (
                        <div className="mt-2 flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-900 rounded-lg text-[10px] font-bold animate-pulse">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Khoa CĐHA (DOC-02) vừa trả kết quả!</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (70% MÀN HÌNH - 8 COLS): KHÔNG GIAN BỆNH ÁN EMR CỦA CA ĐANG CHỌN */}
          <div className="lg:col-span-8 space-y-4">
            {selectedVisit ? (
              <div className="space-y-4">
                
                {/* Header thông tin bệnh nhân + DỊ ỨNG ĐỎ NỔI BẬT */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#005a8b] flex items-center justify-center font-black text-lg">
                      {selectedVisit.visitCode}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900">{selectedVisit.patientName}</h2>
                        <span className="text-xs text-slate-500">
                          ({selectedVisit.patientGender}, sinh {selectedVisit.patientDob})
                        </span>
                        <span className="text-xs font-bold text-[#005a8b] bg-blue-50 px-2 py-0.5 rounded">
                          Nhóm máu: {selectedVisit.bloodType || 'O+'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">SĐT: {selectedVisit.patientPhone} • Vào khám: {selectedVisit.checkInTime}</p>
                    </div>
                  </div>

                  {/* Red Allergy Warning Box */}
                  {selectedVisit.patientAllergies && selectedVisit.patientAllergies.length > 0 && (
                    <div className="p-2.5 bg-red-50 border-2 border-red-400 rounded-2xl flex items-center gap-2 text-red-900 text-xs font-bold shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 animate-bounce" />
                      <span>TIỀN SỬ DỊ ỨNG: {selectedVisit.patientAllergies.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Sub-tabs switch */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setDoc1SubTab('vitals')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      doc1SubTab === 'vitals' ? 'bg-[#0084c7] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Sub-tab 1: Chỉ số Sinh tồn & Khám lâm sàng</span>
                  </button>

                  <button
                    onClick={() => setDoc1SubTab('orders')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      doc1SubTab === 'orders' ? 'bg-[#0084c7] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Scan className="w-4 h-4" />
                    <span>Sub-tab 2: Chỉ định Cận lâm sàng ({selectedVisit.emr?.clinicalOrders?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => setDoc1SubTab('prescription')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      doc1SubTab === 'prescription' ? 'bg-[#0084c7] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span>Sub-tab 3: Kết luận & Kê đơn thuốc</span>
                  </button>
                </div>

                {/* SUB-TAB 1: VITAL SIGNS & CLINICAL EXAM */}
                {doc1SubTab === 'vitals' && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                        Đo Chỉ số Sinh tồn & Tự tính BMI (WHO)
                      </h3>
                      <button
                        onClick={handleSaveVitals}
                        className="px-3 py-1 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold rounded-lg text-xs"
                      >
                        Lưu chỉ số
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Mạch (lần/phút)</label>
                        <input
                          type="number"
                          value={vitals.pulseBpm}
                          onChange={(e) => setVitals({ ...vitals, pulseBpm: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Nhiệt độ (°C)</label>
                        <input
                          type="number"
                          value={vitals.temperatureC}
                          onChange={(e) => setVitals({ ...vitals, temperatureC: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Huyết áp Tâm thu (mmHg)</label>
                        <input
                          type="number"
                          value={vitals.systolicBp}
                          onChange={(e) => setVitals({ ...vitals, systolicBp: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Huyết áp Tâm trương (mmHg)</label>
                        <input
                          type="number"
                          value={vitals.diastolicBp}
                          onChange={(e) => setVitals({ ...vitals, diastolicBp: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Chiều cao (cm)</label>
                        <input
                          type="number"
                          value={vitals.heightCm}
                          onChange={(e) => setVitals({ ...vitals, heightCm: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Cân nặng (kg)</label>
                        <input
                          type="number"
                          value={vitals.weightKg}
                          onChange={(e) => setVitals({ ...vitals, weightKg: Number(e.target.value) })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                      <div className="col-span-2 p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-800 font-bold block">BMI Tự động:</span>
                          <strong className="text-base text-emerald-950 font-black">{bmiVal.toFixed(1)}</strong>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                          {bmiCategory}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                          Khám Lâm Sàng & Bệnh Sử
                        </h3>
                        <button
                          onClick={handleSaveDiagnosis}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                        >
                          Lưu chẩn đoán sơ bộ
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Lý do vào viện & Bệnh sử</label>
                          <textarea
                            rows={2}
                            value={selectedVisit.emr?.chiefComplaint || ''}
                            readOnly
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Chẩn đoán sơ bộ ban đầu *</label>
                            <input
                              type="text"
                              value={prelimDiagnosis}
                              onChange={(e) => setPrelimDiagnosis(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Mã bệnh quốc tế (ICD-10) *</label>
                            <input
                              type="text"
                              value={icd10}
                              onChange={(e) => setIcd10(e.target.value)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold text-emerald-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Hướng xử trí</label>
                          <textarea
                            rows={2}
                            value={conclusion}
                            onChange={(e) => setConclusion(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: CLINICAL ORDERS (Phiếu chỉ định cận lâm sàng liên khoa) */}
                {doc1SubTab === 'orders' && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Phiếu Chỉ Định Cận Lâm Sàng Liên Khoa
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Gửi yêu cầu chụp chiếu/xét nghiệm sang Khoa CĐHA (DOC-02) hoặc Khoa Hóa sinh
                        </p>
                      </div>

                      <button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="px-4 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tạo phiếu chỉ định</span>
                      </button>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-3">
                      {(selectedVisit.emr?.clinicalOrders || []).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                                {ord.orderCode}
                              </span>
                              <strong className="text-slate-900">{ord.serviceName}</strong>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              ord.status === 'COMPLETED'
                                ? 'bg-blue-100 text-[#005a8b]'
                                : ord.status === 'IN_PROGRESS'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.status === 'COMPLETED' ? 'Đã có kết quả' : ord.status === 'IN_PROGRESS' ? 'BS. Lê Hoàng đang thực hiện' : 'Đang chờ tại khoa'}
                            </span>
                          </div>

                          <p className="text-slate-600">
                            Nơi thực hiện: <strong>{ord.targetDepartment}</strong> • Bác sĩ chỉ định: {ord.orderingDoctorName}
                          </p>
                          <p className="text-slate-500 italic">Lý do lâm sàng: {ord.clinicalReason}</p>

                          {/* Completed Subclinical Result Display */}
                          {ord.status === 'COMPLETED' && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-blue-300 space-y-2">
                              <div className="flex items-center justify-between text-[#005a8b] font-bold">
                                <span>Kết quả từ BS. Lê Hoàng (DOC-02):</span>
                                <span className="text-[10px] text-slate-400">{ord.completedAt}</span>
                              </div>
                              <p className="text-slate-700"><strong>Mô tả hình ảnh:</strong> {ord.findingsDescription}</p>
                              <p className="text-[#005a8b] font-bold"><strong>Kết luận CĐHA:</strong> {ord.conclusion}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: PRESCRIPTION & CONCLUSION */}
                {doc1SubTab === 'prescription' && (
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">Kết Luận Ca Khám & Kê Đơn Thuốc</h3>
                        <p className="text-[11px] text-slate-500">Kê đơn ngoại trú có in mã QR và ký số điện tử</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowReferralModal(true)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                        >
                          Chuyển chuyên khoa / Nhập viện
                        </button>
                        <button
                          onClick={() => setShowPrintModal(true)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#005a8b] border border-blue-300 rounded-xl font-bold text-xs flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Xem trước bản in</span>
                        </button>
                      </div>
                    </div>

                    {/* Prescription Items Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 text-xs">Danh mục thuốc điều trị ({rxItems.length}):</span>
                        <button
                          onClick={() => {
                            const med = MEDICINES_CATALOG[2]; // Motilium
                            setRxItems([...rxItems, {
                              id: 'rx_' + Date.now(),
                              medicineName: `${med.name} (${med.dosage})`,
                              dosage: med.dosage,
                              unit: med.unit,
                              quantity: med.defaultQty,
                              schedule: med.schedule,
                              instructions: med.defaultInstruction,
                            }]);
                          }}
                          className="text-[11px] font-bold text-[#0084c7] hover:text-[#005a8b] flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm thuốc Motilium</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2.5">STT</th>
                              <th className="p-2.5">Tên thuốc & Hàm lượng</th>
                              <th className="p-2.5">Số lượng</th>
                              <th className="p-2.5">Liều dùng (Sáng-Trưa-Tối)</th>
                              <th className="p-2.5">Cách dùng</th>
                              <th className="p-2.5 text-right">Xóa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {rxItems.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="p-2.5 font-bold">{idx + 1}</td>
                                <td className="p-2.5 font-semibold text-slate-900">{item.medicineName}</td>
                                <td className="p-2.5 font-bold text-emerald-800">{item.quantity} {item.unit}</td>
                                <td className="p-2.5 text-slate-600">
                                  {item.schedule.morning ? `Sáng: ${item.schedule.morning}` : ''}
                                  {item.schedule.noon ? ` • Trưa: ${item.schedule.noon}` : ''}
                                  {item.schedule.evening ? ` • Tối: ${item.schedule.evening}` : ''}
                                </td>
                                <td className="p-2.5 text-slate-600">{item.instructions}</td>
                                <td className="p-2.5 text-right">
                                  <button
                                    onClick={() => setRxItems(rxItems.filter(i => i.id !== item.id))}
                                    className="text-slate-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Lời dặn của Bác sĩ</label>
                      <textarea
                        rows={2}
                        value={rxAdvice}
                        onChange={(e) => setRxAdvice(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      {selectedVisit.status === 'COMPLETED' ? (
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-[#005a8b] font-bold rounded-xl text-xs">
                            ✓ Ca khám đã hoàn tất
                          </span>
                          <button
                            onClick={() => {
                              setNewEditDiagnosis(prelimDiagnosis);
                              setShowEditEmrModal(true);
                            }}
                            className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-xl font-bold text-xs"
                          >
                            Chỉnh sửa lại đơn thuốc (Yêu cầu Audit Log)
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleCompletePrescription}
                          className="px-6 py-2.5 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Lưu Đơn Thuốc & Hoàn Tất Ca Khám</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-400 text-xs">
                Vui lòng chọn một bệnh nhân từ danh sách hàng chờ bên trái.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================================
           NGỮ CẢNH 5B: BÁC SĨ CẬN LÂM SÀNG (DOC-02 - TS.BS Lê Hoàng Khoa CĐHA)
           ========================================================================= */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hàng Chờ Phiếu Chỉ Định Cận Lâm Sàng (Khoa Chẩn đoán hình ảnh)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Bác sĩ thực hiện: TS.BS Lê Hoàng (DOC-02) • Phòng X-Quang 204
                </p>
              </div>
              <span className="font-mono font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full text-xs">
                {allSubclinicalOrders.length} phiếu chỉ định
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allSubclinicalOrders.map((ord) => {
                const isSelected = ord.id === selectedImagingOrderId;

                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedImagingOrderId(ord.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-300 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                        {ord.orderCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : ord.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.status === 'COMPLETED' ? 'Đã trả KQ' : ord.status === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Chờ chụp'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs">{ord.serviceName}</h4>
                    <p className="text-slate-600 mt-1">Bệnh nhân: <strong>{ord.patientName}</strong></p>
                    <p className="text-slate-500 mt-0.5">BS chỉ định: {ord.orderingDoctorName}</p>
                    <p className="text-slate-500 italic mt-0.5">Lý do: {ord.clinicalReason}</p>

                    {ord.status === 'ORDERED' && (
                      <div className="mt-3 pt-2 border-t border-slate-200 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            acceptClinicalOrder(ord.id, 'DOC-02', 'TS.BS Lê Hoàng');
                            alert('Đã tiếp nhận thực hiện phiếu chỉ định!');
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px]"
                        >
                          Tiếp nhận thực hiện (Gán DOC-02)
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Nhập kết quả & Mô tả hình ảnh */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Nhập Kết Quả & Mô Tả Hình Ảnh Cận Lâm Sàng
              </h3>
              <p className="text-xs text-slate-500">
                Sau khi bấm Hoàn tất, kết quả lập tức được trả về BS. Nguyễn Minh Tuấn (DOC-01) kèm đèn báo tím nhấp nháy!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo */}
              <div className="space-y-3">
                <span className="block font-bold text-slate-700 text-xs">Ảnh Chụp X-Quang Kỹ Thuật Số (DR)</span>
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900">
                  <img
                    src={sampleXrayUrl}
                    alt="X-Quang"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 backdrop-blur-xs rounded-xl text-white text-[10px] flex justify-between">
                    <span>Phòng X-Quang 204</span>
                    <span>DR Sensor 3000x3000px</span>
                  </div>
                </div>
              </div>

              {/* Text Description & Conclusion */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả tổn thương hình ảnh *</label>
                  <textarea
                    rows={4}
                    value={findingsText}
                    onChange={(e) => setFindingsText(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kết luận chẩn đoán hình ảnh *</label>
                  <textarea
                    rows={2}
                    value={imagingConclusion}
                    onChange={(e) => setImagingConclusion(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    submitSubclinicalResult(
                      selectedImagingOrderId,
                      sampleXrayUrl,
                      findingsText,
                      imagingConclusion,
                      'TS.BS Lê Hoàng'
                    );
                    alert('Đã hoàn tất kết luận và trả kết quả về BS. Tuấn (DOC-01)! Bây giờ bạn có thể bấm chuyển sang BS. Tuấn để thấy đèn báo kết quả.');
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Hoàn tất & Trả kết quả về BS. Tuấn (DOC-01)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TẠO PHIẾU CHỈ ĐỊNH CẬN LÂM SÀNG */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-blue-100 text-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tạo Phiếu Chỉ Định Cận Lâm Sàng</h3>
            <p className="text-slate-500 mb-4">Gửi sang Khoa Chẩn đoán hình ảnh & Xét nghiệm</p>

            <form onSubmit={handleSendOrder} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dịch vụ kỹ thuật cần chỉ định:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {CLINICAL_SERVICES_CATALOG.map((serv) => (
                    <label
                      key={serv.code}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                        chosenServiceCode === serv.code
                          ? 'border-[#0084c7] bg-blue-50 text-[#005a8b] ring-1 ring-blue-300 font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="serv"
                        value={serv.code}
                        checked={chosenServiceCode === serv.code}
                        onChange={(e) => setChosenServiceCode(e.target.value)}
                        className="accent-[#0084c7] mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span>{serv.name}</span>
                          <span className="font-mono text-[#0072bc]">{serv.price.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-normal">{serv.department}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý do chỉ định gửi Bác sĩ chụp chiếu:</label>
                <textarea
                  rows={3}
                  required
                  value={orderReason}
                  onChange={(e) => setOrderReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold rounded-xl shadow-xs transition"
                >
                  Phát hành phiếu gửi đi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: XEM TRƯỚC BẢN IN ĐƠN THUỐC CÓ MÃ QR */}
      {showPrintModal && selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-xs text-slate-900 font-serif space-y-4">
            <div className="text-center border-b pb-3 border-slate-300">
              <h4 className="font-bold uppercase tracking-wider text-sm font-sans text-[#005a8b]">BỆNH VIỆN ĐA KHOA QUỐC TẾ PHÚC AN</h4>
              <p className="text-[11px] text-slate-600 font-sans">124 Vũ Trọng Phụng, Thanh Xuân, Hà Nội • Hotline: 1900 6868</p>
              <h2 className="text-base font-bold mt-2 font-sans text-slate-900">ĐƠN THUỐC NGOẠI TRÚ ĐIỆN TỬ</h2>
              <p className="text-[10px] text-slate-500 font-mono">Mã RX: RX-2026-PRINT • Ngày: 31/10/2026</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Bệnh nhân: <strong>{selectedVisit.patientName}</strong></div>
              <div>Bác sĩ: <strong>BS.CKII Nguyễn Minh Tuấn</strong></div>
              <div>Chẩn đoán: <strong>{prelimDiagnosis}</strong></div>
              <div>ICD-10: <strong className="font-mono">{icd10}</strong></div>
            </div>

            <div className="border-t border-b border-slate-300 py-3 space-y-2">
              {rxItems.map((item, idx) => (
                <div key={item.id} className="text-xs">
                  <div className="flex justify-between font-bold">
                    <span>{idx + 1}. {item.medicineName}</span>
                    <span>Số lượng: {item.quantity} {item.unit}</span>
                  </div>
                  <div className="text-slate-600 italic ml-4">↳ {item.instructions}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end pt-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-2 border border-slate-300 rounded-lg">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <span className="text-[10px] text-slate-500 font-sans">Quét tra cứu đơn thuốc điện tử</span>
              </div>

              <div className="text-right space-y-1">
                <p className="italic">Hà Nội, ngày 31 tháng 10 năm 2026</p>
                <p className="font-bold">Bác sĩ khám bệnh</p>
                <p className="text-[#005a8b] italic pt-6 font-semibold">[Đã ký số điện tử BV Phúc An]</p>
                <p className="font-bold">BS.CKII Nguyễn Minh Tuấn</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 font-sans">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold rounded-xl shadow-xs"
              >
                In Đơn Thuốc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA LẠI ĐƠN THUỐC ĐÃ HOÀN TẤT (BẮT BUỘC NHẬP LÝ DO AUDIT LOG) */}
      {showEditEmrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-amber-300 text-xs space-y-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm pb-2 border-b border-amber-200">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>Chốt Chặn Kiểm Toán: Chỉnh Sửa Hồ Sơ Đã Hoàn Tất</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Ca khám này đã được hoàn tất trước đó. Mọi thay đổi về chẩn đoán hoặc đơn thuốc sẽ được hệ thống ghi nhận vào <strong>Nhật ký kiểm toán (Audit Logs)</strong> so sánh giá trị cũ và mới.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Chẩn đoán điều chỉnh mới:</label>
              <input
                type="text"
                value={newEditDiagnosis}
                onChange={(e) => setNewEditDiagnosis(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lý do điều chỉnh (Bắt buộc) *:</label>
              <textarea
                rows={3}
                required
                value={editEmrReason}
                onChange={(e) => setEditEmrReason(e.target.value)}
                placeholder="VD: Bệnh nhân báo thêm triệu chứng ợ chua ban đêm sau khi uống thuốc, bổ sung thêm thuốc kháng axit..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditEmrModal(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmEditEmr}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
              >
                Xác nhận sửa & Ghi Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHUYỂN KHOA */}
      {showReferralModal && selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-blue-100 text-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lập Phiếu Chuyển Chuyên Khoa</h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Khoa tiếp nhận chuyển viện:</label>
              <select
                value={refDept}
                onChange={(e) => setRefDept(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                {SPECIALTIES_DATA.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lý do chuyển khoa:</label>
              <textarea
                rows={3}
                value={refReason}
                onChange={(e) => setRefReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#0084c7] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  createDepartmentReferral(selectedVisit.id, refDept, refReason, 'CHUYEN_KHOA', 'DOC-01');
                  setShowReferralModal(false);
                  alert(`Đã lập phiếu chuyển khoa ${refDept} thành công!`);
                }}
                className="px-5 py-2 bg-[#0084c7] hover:bg-[#0072bc] text-white font-bold rounded-xl shadow-xs transition"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
