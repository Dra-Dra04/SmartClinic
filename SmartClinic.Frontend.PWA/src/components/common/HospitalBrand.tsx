export function HospitalBrand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5">
    <img src="/phuc-an-logo.png" alt="Logo Phúc An" className={`${compact ? 'size-10' : 'size-12'} shrink-0 object-contain`} />
    <div className="leading-tight">
      <span className={`block font-black tracking-tight text-[#0084c7] ${compact ? 'text-sm' : 'text-xl sm:text-2xl'}`}>PHÚC AN HOSPITAL</span>
      {!compact && <span className="block text-[10px] font-semibold text-slate-500">Bệnh viện Đa khoa Quốc tế Phúc An</span>}
    </div>
  </div>;
}
