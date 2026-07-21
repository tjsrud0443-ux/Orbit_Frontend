import React, { useState, useEffect, useRef } from 'react';
import { idDuplCheck, emailDuplCheck } from '../../domains/auth/authApi'; 
import { registerUser } from './adminApi'; 
import { alertConfirm, alertSuccess, alertError } from '../../utils/alert';

const initialForm = {
  name: '',
  id: '',
  pw: '',
  pwConfirm: '',
  phone: '',
  email: '',
  dept_seq: '',
  dept_name: '',
  rank_seq: '',
  rank_name: '',
  hire_date: '',
};

const RegisterUserModal = ({ isOpen, onClose, onSuccess, deptList = [], rankList = [] }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [idChecked, setIdChecked] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [idCheckMsg, setIdCheckMsg] = useState('');
  const [emailCheckMsg, setEmailCheckMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 드롭다운 상태 관리
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRankOpen, setIsRankOpen] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !e.target.closest('.custom-dropdown')) {
        setIsDeptOpen(false);
        setIsRankOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    let finalValue = value;
    
    if (field === 'phone') {
      const onlyNums = value.replace(/[^\d]/g, '').slice(0, 11);
      if (onlyNums.length <= 3) {
        finalValue = onlyNums;
      } else if (onlyNums.length <= 7) {
        finalValue = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3)}`;
      } else if (onlyNums.length <= 10) {
        finalValue = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 6)}-${onlyNums.slice(6)}`;
      } else {
        finalValue = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 7)}-${onlyNums.slice(7)}`;
      }
    }
    
    if (field === 'hire_date') {
      const onlyNums = value.replace(/[^\d]/g, '').slice(0, 8);
      if (onlyNums.length <= 4) {
        finalValue = onlyNums;
      } else if (onlyNums.length <= 6) {
        finalValue = `${onlyNums.slice(0, 4)}-${onlyNums.slice(4)}`;
      } else {
        finalValue = `${onlyNums.slice(0, 4)}-${onlyNums.slice(4, 6)}-${onlyNums.slice(6)}`;
      }
    }

    setForm(prev => ({ ...prev, [field]: finalValue }));
    setErrors(prev => ({ ...prev, [field]: '' }));

    // 아이디/이메일 수정 시 중복확인 무효화
    if (field === 'id') {
      setIdChecked(false);
      setIdCheckMsg('');
    }
    if (field === 'email') {
      setEmailChecked(false);
      setEmailCheckMsg('');
    }
  };

  const handleIdCheck = () => {
    if (!form.id.trim()) {
      setErrors(prev => ({ ...prev, id: '아이디를 입력해주세요.' }));
      return;
    }
    idDuplCheck(form.id).then(resp => {
      // 서버 응답 형태에 맞게 조정 (예: resp.data === true 면 중복)
      const isDuplicate = resp.data === true || resp.data?.duplicate === true;
      if (isDuplicate) {
        setIdChecked(false);
        setIdCheckMsg('이미 사용 중인 아이디입니다.');
      } else {
        setIdChecked(true);
        setIdCheckMsg('사용 가능한 아이디입니다.');
      }
    }).catch(() => {
      setIdChecked(false);
      setIdCheckMsg('중복 확인 중 오류가 발생했습니다.');
    });
  };

  const handleEmailCheck = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요.' }));
      return;
    }
    emailDuplCheck(form.email).then(resp => {
      const isDuplicate = resp.data === true || resp.data?.duplicate === true;
      if (isDuplicate) {
        setEmailChecked(false);
        setEmailCheckMsg('이미 사용 중인 이메일입니다.');
      } else {
        setEmailChecked(true);
        setEmailCheckMsg('사용 가능한 이메일입니다.');
      }
    }).catch(() => {
      setEmailChecked(false);
      setEmailCheckMsg('중복 확인 중 오류가 발생했습니다.');
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim() || form.name.length > 6) newErrors.name = '이름을 1~6자 사이로 입력해주세요.';
    if (!form.id.trim()) newErrors.id = '아이디를 입력해주세요.';
    else if (!idChecked) newErrors.id = '아이디 중복확인을 진행해주세요.';
    if (!form.pw || form.pw.length < 8) newErrors.pw = '비밀번호는 8자 이상 입력해주세요.';
    if (form.pw !== form.pwConfirm) newErrors.pwConfirm = '비밀번호가 일치하지 않습니다.';
    if (!form.email.trim()) newErrors.email = '이메일을 입력해주세요.';
    else if (!emailChecked) newErrors.email = '이메일 중복확인을 진행해주세요.';

    const phoneRegex = /^010-\d{3,4}-\d{4}$/;
    if (!form.phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!phoneRegex.test(form.phone)) {
      newErrors.phone = '올바른 전화번호 형식(010-XXXX-XXXX)으로 입력해주세요.';
    }

    if (!form.dept_seq) newErrors.dept_seq = '부서를 선택해주세요.';
    if (!form.rank_seq) newErrors.rank_seq = '직급을 선택해주세요.';
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!form.hire_date.trim()) {
      newErrors.hire_date = '입사일자를 입력해주세요.';
    } else if (!dateRegex.test(form.hire_date)) {
      newErrors.hire_date = 'YYYY-MM-DD 형식으로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    alertConfirm('직원 등록', '입력한 정보로 직원을 등록하시겠습니까?').then((result) => {
      if (!result.isConfirmed) return;

      setSubmitting(true);
      registerUser({
        name: form.name,
        id: form.id,
        pw: form.pw,
        email: form.email,
        phone: form.phone,
        dept_seq: form.dept_seq,
        rank_seq: form.rank_seq,
        hire_date: form.hire_date,
      }).then(() => {
        alertSuccess('등록 완료', '직원이 성공적으로 등록되었습니다.');
        onSuccess?.();
        handleClose();
      }).catch(() => {
        alertError('오류 발생', '직원 등록 중 오류가 발생했습니다.');
      }).finally(() => {
        setSubmitting(false);
      });
    });
  };

  const handleClose = () => {
    setForm(initialForm);
    setErrors({});
    setIdChecked(false);
    setEmailChecked(false);
    setIdCheckMsg('');
    setEmailCheckMsg('');
    setIsDeptOpen(false);
    setIsRankOpen(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={modalRef} className="bg-white rounded-[32px] shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">직원 등록</h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
          {/* 이름 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              maxLength={6}
              className={`w-full px-3 py-2.5 bg-white border ${errors.name ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
            />
            {errors.name && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* 아이디 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">아이디</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.id}
                onChange={(e) => handleChange('id', e.target.value)}
                className={`flex-1 px-3 py-2.5 bg-white border ${errors.id ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
              />
              <button
                type="button"
                onClick={handleIdCheck}
                className="px-3 py-2 text-xs font-bold text-[#3530B8] bg-[#F0F4FF] rounded-xl hover:bg-[#e4ebff] transition-all whitespace-nowrap"
              >
                중복확인
              </button>
            </div>
            {errors.id && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.id}</p>}
            {!errors.id && idCheckMsg && (
              <p className={`text-[0.6875rem] mt-1 ${idChecked ? 'text-[#10B981]' : 'text-red-500'}`}>{idCheckMsg}</p>
            )}
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">비밀번호</label>
            <input
              type="password"
              value={form.pw}
              onChange={(e) => handleChange('pw', e.target.value)}
              className={`w-full px-3 py-2.5 bg-white border ${errors.pw ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
            />
            {errors.pw && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.pw}</p>}
          </div>

          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">비밀번호 확인</label>
            <input
              type="password"
              value={form.pwConfirm}
              onChange={(e) => handleChange('pwConfirm', e.target.value)}
              className={`w-full px-3 py-2.5 bg-white border ${errors.pwConfirm ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
            />
            {errors.pwConfirm && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.pwConfirm}</p>}
          </div>

          {/* 이메일 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`flex-1 px-3 py-2.5 bg-white border ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all`}
              />
              <button
                type="button"
                onClick={handleEmailCheck}
                className="px-3 py-2 text-xs font-bold text-[#3530B8] bg-[#F0F4FF] rounded-xl hover:bg-[#e4ebff] transition-all whitespace-nowrap"
              >
                중복확인
              </button>
            </div>
            {errors.email && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.email}</p>}
            {!errors.email && emailCheckMsg && (
              <p className={`text-[0.6875rem] mt-1 ${emailChecked ? 'text-[#10B981]' : 'text-red-500'}`}>{emailCheckMsg}</p>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">전화번호</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="010-0000-0000 형식으로 입력해주세요"
              className={`w-full px-3 py-2.5 bg-white border ${errors.phone ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all placeholder:text-gray-300`}
            />
            {errors.phone && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.phone}</p>}
          </div>

          {/* 부서 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">부서</label>
            <div className="relative custom-dropdown">
              <div 
                onClick={() => {
                  setIsDeptOpen(!isDeptOpen);
                  setIsRankOpen(false);
                }}
                className={`w-full px-3 py-2.5 bg-white border ${errors.dept_seq ? 'border-red-400' : isDeptOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-xl text-sm transition-all cursor-pointer flex justify-between items-center text-slate-700`}
              >
                <span className={form.dept_name ? 'text-slate-800 font-medium' : 'text-gray-400'}>
                  {form.dept_name || '선택해주세요'}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isDeptOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                  {deptList.map(dept => (
                    <div 
                      key={dept.dept_seq}
                      onClick={() => { 
                        setForm(prev => ({ ...prev, dept_seq: dept.dept_seq, dept_name: dept.dept_name }));
                        setErrors(prev => ({ ...prev, dept_seq: '' }));
                        setIsDeptOpen(false); 
                      }}
                      className="px-3 py-2 text-xs hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0 text-slate-700"
                    >
                      {dept.dept_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.dept_seq && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.dept_seq}</p>}
          </div>

          {/* 직급 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">직급</label>
            <div className="relative custom-dropdown">
              <div 
                onClick={() => {
                  setIsRankOpen(!isRankOpen);
                  setIsDeptOpen(false);
                }}
                className={`w-full px-3 py-2.5 bg-white border ${errors.rank_seq ? 'border-red-400' : isRankOpen ? 'border-[#3530B8] ring-4 ring-[#3530B8]/5' : 'border-gray-200'} rounded-xl text-sm transition-all cursor-pointer flex justify-between items-center text-slate-700`}
              >
                <span className={form.rank_name ? 'text-slate-800 font-medium' : 'text-gray-400'}>
                  {form.rank_name || '선택해주세요'}
                </span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isRankOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {isRankOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                  {rankList.map(rank => (
                    <div 
                      key={rank.rank_seq}
                      onClick={() => { 
                        setForm(prev => ({ ...prev, rank_seq: rank.rank_seq, rank_name: rank.rank_name }));
                        setErrors(prev => ({ ...prev, rank_seq: '' }));
                        setIsRankOpen(false); 
                      }}
                      className="px-3 py-2 text-xs hover:bg-[#F0F4FF] hover:text-[#3530B8] cursor-pointer font-bold border-b border-gray-50 last:border-0 text-slate-700"
                    >
                      {rank.rank_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.rank_seq && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.rank_seq}</p>}
          </div>

          {/* 입사일자 - 직접 입력 */}
          <div>
            <label className="text-xs text-slate-500 font-semibold mb-1.5 block">입사일자</label>
            <input
              type="text"
              value={form.hire_date}
              onChange={(e) => handleChange('hire_date', e.target.value)}
              placeholder="YYYY-MM-DD 형식으로 입력해주세요"
              className={`w-full px-3 py-2.5 bg-white border ${errors.hire_date ? 'border-red-400' : 'border-gray-200'} rounded-xl text-sm outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all placeholder:text-gray-300`}
            />
            {errors.hire_date && <p className="text-[0.6875rem] text-red-500 mt-1">{errors.hire_date}</p>}
          </div>
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all disabled:opacity-50"
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterUserModal;