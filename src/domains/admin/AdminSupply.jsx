import React, { useState } from 'react';
import Pagination from '../../components/common/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

// ── 더미 데이터 ──────────────────────────────────────────────
const CATEGORIES = ['전체', '사무용품', '전자기기', '가구', '네트워크 장비'];

const INITIAL_SUPPLIES = [
  { id: 1, name: '노트북', category: '전자기기', code: 'EQP-0001', totalQty: 10, stockQty: 7, minStockQty: 3, status: '정상' },
  { id: 2, name: '빔 프로젝터', category: '전자기기', code: 'EQP-0002', totalQty: 3, stockQty: 1, minStockQty: 2, status: '정상' },
  { id: 3, name: '회의용 마이크', category: '전자기기', code: 'EQP-0003', totalQty: 8, stockQty: 0, minStockQty: 2, status: '정상' },
  { id: 4, name: '화이트보드', category: '사무용품', code: 'EQP-0004', totalQty: 5, stockQty: 2, minStockQty: 1, status: '정상' },
  { id: 5, name: '의자', category: '가구', code: 'EQP-0005', totalQty: 20, stockQty: 15, minStockQty: 5, status: '정상' },
  { id: 6, name: 'A4 용지', category: '사무용품', code: 'EQP-0006', totalQty: 200, stockQty: 150, minStockQty: 30, status: '정상' },
  { id: 7, name: '무선 마우스', category: '전자기기', code: 'EQP-0007', totalQty: 40, stockQty: 18, minStockQty: 5, status: '정상' },
  { id: 8, name: '스위칭 허브', category: '네트워크 장비', code: 'EQP-0008', totalQty: 10, stockQty: 3, minStockQty: 2, status: '정상' },
];

const RENTAL_LIST = [
  { id: 1, name: '노트북', category: '전자기기', code: 'EQP-0001', dept: '개발팀', renter: '김개발', rentalDate: '2026-05-01' },
  { id: 2, name: '빔 프로젝터', category: '전자기기', code: 'EQP-0002', dept: '마케팅팀', renter: '이마케팅', rentalDate: '2026-05-10' },
  { id: 3, name: '회의용 마이크', category: '전자기기', code: 'EQP-0003', dept: '인사팀', renter: '박인사', rentalDate: '2026-05-15' },
  { id: 4, name: '노트북', category: '전자기기', code: 'EQP-0001', dept: '재무팀', renter: '최재무', rentalDate: '2026-05-20' },
  { id: 5, name: '빔 프로젝터', category: '전자기기', code: 'EQP-0002', dept: '기획팀', renter: '정기획', rentalDate: '2026-06-01' },
];

// ── 재고 상태 계산 ────────────────────────────────────────────
const getStockStatus = (item) => {
  if (item.stockQty === 0) return '재고 없음';
  if (item.stockQty <= item.minStockQty) return '재고 부족';
  return '재고 여유';
};

const StockBadge = ({ status }) => {
  const styles = {
    '재고 여유': 'bg-[#F0FDF4] text-[#10B981] border border-[#10B981]/30',
    '재고 부족': 'bg-[#FFF9F0] text-[#FF9800] border border-[#FF9800]/30',
    '재고 없음': 'bg-[#FFF0F0] text-[#FF4D4F] border border-[#FF4D4F]/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-center whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
};

// ── 비품 추가/수정 모달 ───────────────────────────────────────
const SupplyModal = ({ mode, supply, onClose, onSave }) => {
  const [form, setForm] = useState(
    supply || { name: '', category: '사무용품', code: '', totalQty: '', stockQty: '', minStockQty: '' }
  );

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-[32px] shadow-xl w-full max-w-md mx-4 p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'add' ? '비품 추가' : '비품 수정'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 비품명 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">비품명</label>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="비품명을 입력하세요"
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
            />
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">카테고리</label>
            <select
              value={form.category}
              onChange={e => handleChange('category', e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
            >
              {CATEGORIES.filter(c => c !== '전체').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 비품코드 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">비품코드</label>
            <input
              type="text"
              value={form.code}
              onChange={e => handleChange('code', e.target.value)}
              placeholder="예: EQP-0001"
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all font-mono"
            />
          </div>

          {/* 수량 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">
                {mode === 'add' ? '초기 재고' : '보유 수량'}
              </label>
              <input
                type="number"
                value={mode === 'add' ? form.stockQty : form.totalQty}
                onChange={e => handleChange(mode === 'add' ? 'stockQty' : 'totalQty', e.target.value)}
                placeholder="0"
                min="0"
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">최소 재고</label>
              <input
                type="number"
                value={form.minStockQty}
                onChange={e => handleChange('minStockQty', e.target.value)}
                placeholder="0"
                min="0"
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-10">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={() => { onSave(form); onClose(); }}
            className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all"
          >
            {mode === 'add' ? '비품 등록' : '정보 저장'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────
const AdminSupply = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'rental'
  const [supplies, setSupplies] = useState(INITIAL_SUPPLIES);
  const [rentals, setRentals] = useState(RENTAL_LIST);

  // 검색 / 필터
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');

  // 체크박스
  const [checkedIds, setCheckedIds] = useState([]);

  // 페이지
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // 모달
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', supply? }

  // ── 비품 목록 필터링
  const filtered = supplies.filter(item => {
    const stockStatus = getStockStatus(item);
    const matchKeyword =
      item.name.toLowerCase().includes(keyword.toLowerCase()) ||
      item.code.toLowerCase().includes(keyword.toLowerCase());
    const matchCategory = categoryFilter === '전체' || item.category === categoryFilter;
    const matchStatus = statusFilter === '전체' || stockStatus === statusFilter;
    return matchKeyword && matchCategory && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── 대여 목록 필터링
  const filteredRentals = rentals.filter(item =>
    item.name.toLowerCase().includes(keyword.toLowerCase()) ||
    item.category.toLowerCase().includes(keyword.toLowerCase())
  );
  const paginatedRentals = filteredRentals.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── 체크박스
  const toggleCheck = (id) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    const ids = paginated.map(i => i.id);
    const allChecked = ids.every(id => checkedIds.includes(id));
    setCheckedIds(allChecked ? checkedIds.filter(id => !ids.includes(id)) : [...new Set([...checkedIds, ...ids])]);
  };

  // ── 삭제
  const handleDelete = (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    setSupplies(prev => prev.filter(i => i.id !== id));
    setCheckedIds(prev => prev.filter(i => i !== id));
  };
  const handleBulkDelete = () => {
    if (checkedIds.length === 0) return;
    if (!window.confirm(`${checkedIds.length}개 항목을 삭제하시겠습니까?`)) return;
    setSupplies(prev => prev.filter(i => !checkedIds.includes(i.id)));
    setCheckedIds([]);
  };

  // ── 저장 (추가/수정)
  const handleSave = (form) => {
    if (modal.mode === 'add') {
      setSupplies(prev => [...prev, { ...form, id: Date.now(), totalQty: Number(form.stockQty), stockQty: Number(form.stockQty), minStockQty: Number(form.minStockQty) }]);
    } else {
      setSupplies(prev => prev.map(i => i.id === modal.supply.id ? { ...i, ...form } : i));
    }
  };

  // ── 반납
  const handleReturn = (id) => {
    setRentals(prev => prev.filter(i => i.id !== id));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setKeyword('');
    setCheckedIds([]);
  };

  return (
    <div className="w-full min-h-screen bg-white p-6 md:p-8 font-sans">
      {/* 모달 */}
      {modal && (
        <SupplyModal
          mode={modal.mode}
          supply={modal.supply}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* 헤더 */}
      <div className="mb-7">
        <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">비품 관리</h1>
        <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">등록된 비품 현황을 확인하고 관리할 수 있습니다.</p>
      </div>

      {/* 탭 + 비품 추가 버튼 */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-[#F0F4FF] flex-shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange('list')}
            className={`px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap
              ${activeTab === 'list' ? 'bg-[#3530B8] text-white shadow-md' : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'}`}
          >
            비품 목록 <span className={`ml-1 ${activeTab === 'list' ? 'opacity-80' : 'text-gray-400'}`}>({supplies.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('rental')}
            className={`px-4 py-2 text-[0.6875rem] md:text-sm font-semibold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5
              ${activeTab === 'rental' ? 'bg-[#3530B8] text-white shadow-md' : 'text-gray-500 hover:text-[#3530B8] hover:bg-[#F0F4FF]'}`}
          >
            대여 중 <span className={`ml-1 ${activeTab === 'rental' ? 'opacity-80' : 'text-gray-400'}`}>({rentals.length})</span>
          </button>
        </div>

        {activeTab === 'list' && (
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-1.5 px-5 py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" />
            </svg>
            비품 추가
          </button>
        )}
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">

        {/* 검색 + 필터 */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder={activeTab === 'list' ? '비품명, 비품코드 검색' : '비품명, 카테고리 검색'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
              focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          {activeTab === 'list' && (
            <>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] transition-all bg-white min-w-[120px]"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>카테고리: {c}</option>)}
              </select>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] transition-all bg-white min-w-[120px]"
              >
                {['전체', '재고 여유', '재고 부족', '재고 없음'].map(s => (
                  <option key={s} value={s}>상태: {s}</option>
                ))}
              </select>
              <button
                onClick={handleBulkDelete}
                disabled={checkedIds.length === 0}
                className={`flex items-center gap-1.5 px-5 py-2.5 border rounded-full text-sm font-bold transition-all
                  ${checkedIds.length > 0
                    ? 'border-red-200 text-red-500 hover:bg-red-50 shadow-sm'
                    : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                선택 삭제 {checkedIds.length > 0 && `(${checkedIds.length})`}
              </button>
            </>
          )}
        </div>

        {/* ── 비품 목록 탭 ── */}
        {activeTab === 'list' && (
          <>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {/* 테이블 헤더 */}
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100">
                <div className="col-span-1 px-4 py-3 flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && paginated.every(i => checkedIds.includes(i.id))}
                    onChange={toggleAll}
                    className="accent-indigo-600 w-4 h-4 cursor-pointer"
                  />
                </div>
                {['비품명', '카테고리', '비품코드', '총 수량', '재고', '상태', '관리'].map((h, i) => (
                  <div key={h} className={`py-3 text-[0.68rem] font-extrabold text-gray-400 uppercase tracking-wider
                    ${i === 0 ? 'col-span-3 px-4' : i === 1 ? 'col-span-2 px-4' : i === 2 ? 'col-span-2 px-4 text-center' : i === 3 ? 'col-span-1 px-4 text-center' : i === 4 ? 'col-span-1 px-4 text-center' : i === 5 ? 'col-span-1 px-4 text-center' : 'col-span-1 px-4 text-center'}`}>
                    {h}
                  </div>
                ))}
              </div>

              {/* 테이블 바디 */}
              {paginated.length > 0 ? paginated.map(item => {
                const stockStatus = getStockStatus(item);
                return (
                  <div key={item.id} className="grid grid-cols-12 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/60 transition-colors">
                    <div className="col-span-1 px-4 py-3.5 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(item.id)}
                        onChange={() => toggleCheck(item.id)}
                        className="accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="col-span-3 px-4 py-3.5">
                      <p className="text-sm font-bold text-gray-800">{item.name}</p>
                    </div>
                    <div className="col-span-2 px-4 py-3.5">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">{item.category}</span>
                    </div>
                    <div className="col-span-2 px-4 py-3.5 text-center">
                      <span className="text-sm text-gray-500 font-mono">{item.code}</span>
                    </div>
                    <div className="col-span-1 px-4 py-3.5 text-center">
                      <span className="text-sm font-bold text-gray-700">{item.totalQty}</span>
                    </div>
                    <div className="col-span-1 px-4 py-3.5 text-center">
                      <span className="text-sm font-bold text-gray-700">{item.stockQty}</span>
                    </div>
                    <div className="col-span-1 px-4 py-3.5 text-center">
                      <StockBadge status={stockStatus} />
                    </div>
                    <div className="col-span-1 px-4 py-3.5 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setModal({ mode: 'edit', supply: item })}
                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                        title="수정"
                      >
                        <FontAwesomeIcon icon={faEdit} className="text-xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                        title="삭제"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                      </button>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-16 text-center text-sm text-gray-400 font-bold">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>

            <Pagination count={Math.ceil(filtered.length / PER_PAGE)} page={page} onChange={(_, v) => setPage(v)} />
          </>
        )}

        {/* ── 대여 중 탭 ── */}
        {activeTab === 'rental' && (
          <>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100">
                {['비품명', '카테고리', '비품코드', '대여 부서', '대여자', '대여일', '관리'].map((h, i) => (
                  <div key={h} className={`py-3 text-[0.68rem] font-extrabold text-gray-400 uppercase tracking-wider px-4
                    ${i === 0 ? 'col-span-2' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-2 text-center' : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-2' : i === 5 ? 'col-span-1' : 'col-span-1 text-center'}`}>
                    {h}
                  </div>
                ))}
              </div>

              {paginatedRentals.length > 0 ? paginatedRentals.map(item => (
                <div key={item.id} className="grid grid-cols-12 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/60 transition-colors">
                  <div className="col-span-2 px-4 py-3.5">
                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                  </div>
                  <div className="col-span-2 px-4 py-3.5">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 text-gray-500">{item.category}</span>
                  </div>
                  <div className="col-span-2 px-4 py-3.5 text-center">
                    <span className="text-sm text-gray-500 font-mono">{item.code}</span>
                  </div>
                  <div className="col-span-2 px-4 py-3.5">
                    <span className="text-sm text-gray-700 font-medium">{item.dept}</span>
                  </div>
                  <div className="col-span-2 px-4 py-3.5">
                    <span className="text-sm text-gray-700 font-medium">{item.renter}</span>
                  </div>
                  <div className="col-span-1 px-4 py-3.5">
                    <span className="text-xs text-gray-500">{item.rentalDate}</span>
                  </div>
                  <div className="col-span-1 px-4 py-3.5 flex justify-center">
                    <button
                      onClick={() => handleReturn(item.id)}
                      className="px-4 py-1 text-xs font-bold text-emerald-600 bg-white border border-emerald-300 rounded-full hover:bg-emerald-50 transition-colors shadow-sm"
                    >
                      반납
                    </button>
                  </div>
                </div>
              )) : (
                <div className="py-16 text-center text-sm text-gray-400 font-bold">
                  대여 중인 비품이 없습니다.
                </div>
              )}
            </div>

            <Pagination count={Math.ceil(filteredRentals.length / PER_PAGE)} page={page} onChange={(_, v) => setPage(v)} />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminSupply;
