import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { UserPlus, X } from 'lucide-react';
import { assignAccountRole, createAdminAccount, listAccountSpecialties } from '../../services/adminAccountsService';
import type { AdminAccount, AssignableRole } from '../../services/adminAccountsService';
import { authErrorMessage } from '../../services/authService';

export function AccountManagementDialog({ account, onClose, onSaved }: {
  account: AdminAccount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<AssignableRole>(() => {
    if (account?.role === 'Doctor' || account?.role === 'Receptionist') return account.role;
    return account ? 'Patient' : 'Receptionist';
  });
  const [specialtyId, setSpecialtyId] = useState(account?.specialtyId?.toString() ?? '');
  const [specialties, setSpecialties] = useState<{ id: number; name: string }[] | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== 'Doctor') return;
    const request = new AbortController();
    setLookupError('');
    listAccountSpecialties(request.signal).then(items => {
      if (!request.signal.aborted) {
        if (account?.role === 'Doctor' && account.specialtyId && !items.some(s => s.id === account.specialtyId))
          items = [...items, { id: account.specialtyId, name: (account.specialtyName ?? 'Chuyên khoa hiện tại') + ' (ngừng sử dụng)' }];
        setSpecialties(items);
      }
    }).catch(failure => {
      if (!request.signal.aborted) setLookupError(authErrorMessage(failure));
    });
    return () => request.abort();
  }, [role, lookupAttempt, account]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || (role === 'Doctor' && !specialtyId)) return;
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get('fullName') ?? '').trim();
    if (!account && !fullName) {
      setError('Hãy nhập họ và tên người dùng.');
      return;
    }
    const assignment = { role, specialtyId: role === 'Doctor' ? Number(specialtyId) : null };
    setError('');
    setSaving(true);
    try {
      if (account) {
        await assignAccountRole(account.id, assignment);
      } else {
        await createAdminAccount({
          ...assignment, email: String(form.get('email')).trim(),
          phoneNumber: String(form.get('phone')).trim(), password: String(form.get('password')),
          fullName,
          department: role === 'Doctor' ? null : String(form.get('department')).trim() || null,
          identityNumber: String(form.get('identityNumber')).trim() || null,
        });
      }
      onSaved();
    } catch (failure) {
      setError(authErrorMessage(failure));
    } finally {
      setSaving(false);
    }
  }

  const title = account ? 'Cấp quyền tài khoản' : 'Thêm Tài Khoản Người Dùng Mới';
  const field = 'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
    <section role="dialog" aria-modal="true" aria-label={title}
      className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold"><UserPlus className="size-5 text-[#0084c7]" />{title}</h3>
        <button type="button" aria-label="Đóng" disabled={saving} onClick={onClose}><X className="size-5" /></button>
      </header>
      {account && <p className="px-5 pt-4 break-all text-sm text-slate-600">{account.email}</p>}
      <form onSubmit={submit} className="space-y-4 p-5 text-xs">
        <fieldset disabled={saving} className="space-y-3">
          {!account && <>
            <label className="block font-semibold">Họ và tên người dùng <span className="text-red-600">*</span>
              <input required name="fullName" maxLength={100} placeholder="VD: TS.BS Lê Thị Ánh Tuyết" className={field} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>Email đăng nhập <span className="text-red-600">*</span>
                <input required type="email" name="email" maxLength={255} placeholder="tuyet.la@phucan.vn" autoComplete="off" className={field} />
              </label>
              <label>Số điện thoại<input type="tel" name="phone" pattern="[+]?[0-9]{9,15}" placeholder="0918889900" className={field} /></label>
            </div>
          </>}
          <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">{account ? 'Vai trò' : 'Vai trò khởi tạo'} <span className="text-red-600">*</span><select className={field} value={role} onChange={event => {
            setRole(event.target.value as AssignableRole);
            setSpecialtyId('');
          }}>
            <option value="Receptionist">Lễ tân</option>
            <option value="Doctor">Bác sĩ</option>
            <option value="Patient">Bệnh nhân</option>
          </select></label>
          {role === 'Doctor' && <label className="block">Chuyên khoa<select required className={field}
            value={specialtyId} onChange={event => setSpecialtyId(event.target.value)}>
            <option value="">{specialties ? 'Chọn chuyên khoa' : 'Đang tải chuyên khoa…'}</option>
            {specialties?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select></label>}
          {!account && role !== 'Doctor' && <label>Khoa / Đơn vị công tác
            <input name="department" maxLength={150} placeholder="VD: Quầy tiếp đón" className={field} />
          </label>}
          </div>
          {!account && <>
            <label className="block">Số CCCD / Định danh (Tùy chọn)
              <input name="identityNumber" inputMode="numeric" pattern="[0-9]{12}" maxLength={12} placeholder="12 số căn cước gắn chip" className={field} />
            </label>
            <label className="block">Mật khẩu <span className="text-red-600">*</span>
              <input required type="password" name="password" minLength={10} maxLength={128}
                autoComplete="new-password" placeholder="Tối thiểu 10 ký tự" className={field} />
            </label>
          </>}
        </fieldset>
        {role === 'Doctor' && lookupError && <div role="alert" className="text-rose-700">
          {lookupError} <button type="button" className="underline" onClick={() => setLookupAttempt(value => value + 1)}>Thử lại</button>
        </div>}
        {role === 'Doctor' && specialties?.length === 0 && <p>Chưa có chuyên khoa.</p>}
        {account && <p className="text-xs text-slate-600">Sau khi lưu quyền, người dùng cần đăng nhập lại.</p>}
        {error && <p role="alert" className="text-rose-700">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-3">
          <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2">Hủy bỏ</button>
          <button type="submit" disabled={saving || (role === 'Doctor' &&
            (!!lookupError || !specialties?.some(item => String(item.id) === specialtyId)))}
            className="rounded-lg bg-[#0084c7] px-4 py-2 font-bold text-white disabled:opacity-50">
            {saving ? 'Đang lưu…' : account ? 'Lưu quyền' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </section>
  </div>;
}
