import React, { useState,useEffect, useRef } from 'react';
import { Pagination as MuiPagination, Stack, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { deleteAdminSupplies, getAdminSupplies, insertAdminSupplies, updateAdminSupplies} from '../admin/adminApi';

const CATEGORIES = ['전체', '사무용품', '전자기기', '가구', '네트워크 장비'];

// ── 로컬 반응형 페이지네이션 ──────────────────────────────────
const StyledAdminPagination = styled(MuiPagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    fontFamily: 'inherit',
    fontWeight: 'bold',
    borderRadius: '0.75rem',
    '&.Mui-selected': {
      backgroundColor: '#3530B8',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#2a2594',
      },
    },
    '&:hover': {
      backgroundColor: '#F0F4FF',
      color: '#3530B8',
    },
    [theme.breakpoints.down('sm')]: {
      minWidth: '2rem',
      height: '2rem',
      margin: '0 0.0625rem',
    },
  },
}));

const AdminPagination = ({ count, page, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: { xs: 2, sm: 3 } }}>
      <StyledAdminPagination
        count={count}
        page={page}
        onChange={onChange}
        variant="outlined"
        shape="rounded"
        color="primary"
        size={isMobile ? "small" : "medium"}
        siblingCount={isMobile ? 0 : 1}
        boundaryCount={isMobile ? 1 : 1}
      />
    </Stack>
  );
};

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
    <span className={`px-2.5 py-0.5 rounded-full text-[0.625rem] font-semibold text-center whitespace-nowrap ${styles[status]}`}>
      {status}
    </span>
  );
};

// ── 비품 추가/수정 모달 ───────────────────────────────────────
const SupplyModal = ({ mode, supply, onClose, onSave }) => {
  const [form, setForm] = useState(
    supply || { name: '', category: '사무용품', code: '', totalQty: '', stockQty: '', minStockQty: '' }
  );
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null); 

    // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-md mx-4 p-8">
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
            <div className="flex items-center justify-between">
              <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">비품명</label>
               <span className={`text-[0.6875rem] ${form.name.length >= 60 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {form.name.length}/66
              </span>
            </div>
            <input
              type="text"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="비품명을 입력하세요"
              maxLength={66} 
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all"
            />
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">카테고리</label>
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 transition-all flex items-center justify-between"
              >
                <span>{form.category}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden py-1">
                  {CATEGORIES.filter(c => c !== '전체').map(cat => (
                    <div
                      key={cat}
                      onClick={() => { handleChange('category', cat); setIsCategoryOpen(false); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                        ${form.category === cat
                          ? 'bg-[#3530B8] text-white font-bold'
                          : 'text-gray-700 hover:bg-indigo-50 hover:text-[#3530B8] font-medium'}`}
                    >
                      {cat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 비품코드 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">비품코드</label>
            <input
              type="text"
              value={form.code}
              onChange={e => handleChange('code', e.target.value)}
              placeholder="예: EQP-0001"
              readOnly={mode === 'edit'}
              maxLength={50}
              className={`px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none font-mono transition-all
              ${mode === 'edit'
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'  // 수정 모드 - 회색
                : 'bg-white text-gray-700 focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5'  // 추가 모드 - 정상
              }`}
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
            onClick={() => onSave(form)}
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
  const [supplies, setSupplies] = useState([]);

  // 검색 / 필터
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [statusFilter, setStatusFilter] = useState('전체');

  // 드롭다운 상태 관리
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const catRef = useRef(null);
  const statusRef = useRef(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) setIsCatOpen(false);
      if (statusRef.current && !statusRef.current.contains(e.target)) setIsStatusOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 체크박스
  const [checkedIds, setCheckedIds] = useState([]);

  // 페이지
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // 모달
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', supply? }

    useEffect(() => {
      const fetchSupplies = () => {
        getAdminSupplies().then(res => {
          const mapped = res.data.map(item => ({
            id: item.supply_seq,
            name: item.supply_name,
            category: item.category,
            code: item.supply_code,
            totalQty: item.total_qty,
            stockQty: item.stock_qty,
            minStockQty: item.min_stock_qty,
          }));
          setSupplies(mapped);
        });
      };

      fetchSupplies(); // 최초 실행
      window.addEventListener('focus', fetchSupplies); // 탭 포커스될 때마다 갱신
      return () => window.removeEventListener('focus', fetchSupplies); // 클린업
    }, []);

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

  // ── 체크박스
  const toggleCheck = (id) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    const ids = paginated.map(i => i.id);
    const allChecked = ids.every(id => checkedIds.includes(id));
    setCheckedIds(allChecked ? checkedIds.filter(id => !ids.includes(id)) : [...new Set([...checkedIds, ...ids])]);
  };

  // 단건 삭제
  const handleDelete = (id) => {
    if (!window.confirm('해당 비품을 삭제하시겠습니까?')) return;
      deleteAdminSupplies([id]).then(() => {       // ← [id] 배열로 감싸서 전송
        alert('삭제되었습니다.');
        setSupplies(prev => prev.filter(i => i.id !== id));
        setCheckedIds(prev => prev.filter(i => i !== id));
      });
  };
  //다중 삭제
  const handleBulkDelete = () => {
    if (checkedIds.length === 0) return;
    if (!window.confirm(`${checkedIds.length}개 항목을 삭제하시겠습니까?`)) return;
    deleteAdminSupplies(checkedIds).then(() => {  // ← API 호출 추가
      alert(`${checkedIds.length}개 항목이 삭제되었습니다.`); 
      setSupplies(prev => prev.filter(i => !checkedIds.includes(i.id)));
      setCheckedIds([]);
    });
  };

  // ── 저장 (추가/수정)
const handleSave = async (form) => {
  if (modal.mode === 'add') {
    // 이미 불러온 목록에서 중복 체크
    const isDuplicate = supplies.some(item => item.code === form.code);
    if (isDuplicate) {
      alert('이미 존재하는 비품코드입니다.');
      return; 
    }
    try {
      await insertAdminSupplies({
        supply_name: form.name,
        category: form.category,
        supply_code: form.code,
        total_qty: form.stockQty,
        stock_qty: form.stockQty,
        min_stock_qty: form.minStockQty,
      });
      alert('비품이 등록되었습니다.');
      setModal(null); 
      const resp = await getAdminSupplies();
      setSupplies(resp.data.map(item => ({
        id: item.supply_seq,
        name: item.supply_name,
        category: item.category,
        code: item.supply_code,
        totalQty: item.total_qty,
        stockQty: item.stock_qty,
        minStockQty: item.min_stock_qty,
      })));
    } catch (error) {
      alert(error.response?.data || '등록 중 오류가 발생했습니다.');
    }
  } else {
    try {
      await updateAdminSupplies({
        supply_seq: form.id,
        supply_name: form.name,
        category: form.category,
        total_qty: form.totalQty,
        min_stock_qty: form.minStockQty,
      });
      alert('비품이 수정되었습니다.');
      setModal(null);
      const resp = await getAdminSupplies();
      setSupplies(resp.data.map(item => ({
        id: item.supply_seq,
        name: item.supply_name,
        category: item.category,
        code: item.supply_code,
        totalQty: item.total_qty,
        stockQty: item.stock_qty,
        minStockQty: item.min_stock_qty,
      })));
    } catch (error) {
      console.log(error);  // ← 추가
      alert(error.response?.data || '수정 중 오류가 발생했습니다.');
    }
  }
};

  return (
    <div className="w-full h-full bg-white p-6 md:p-8 font-sans flex flex-col overflow-hidden">
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
      <div className="mb-7 shrink-0 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">비품 관리</h1>
          <p className="text-[0.6875rem] md:text-sm text-gray-500">등록된 비품 현황을 확인하고 관리할 수 있습니다.</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center justify-center gap-1.5 p-2.5 sm:px-5 sm:py-2.5 md:py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all shrink-0"
          title="비품 추가"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">비품 추가</span>
        </button>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm p-4 md:p-6 flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* 검색 + 필터 */}
        <div className="flex flex-wrap items-center gap-3 mb-5 shrink-0">
          <div className="flex-1" />
          {/* 검색창 */}
          <div className="relative w-70">
            <input
              type="text"
              value={keyword}
              onChange={e => { setKeyword(e.target.value); setPage(1); }}
              placeholder="비품명 또는 비품코드 검색"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
              focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all 
              placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* 카테고리 드롭다운 */}
            <div className="relative flex-1 lg:min-w-[8.75rem]" ref={catRef}>
              <button
                onClick={() => setIsCatOpen(!isCatOpen)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] transition-all flex items-center justify-between shadow-sm hover:border-gray-300"
              >
                <span className="truncate">{categoryFilter === '전체' ? '모든 카테고리' : categoryFilter}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCatOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isCatOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden py-1">
                  {CATEGORIES.map(c => (
                    <div
                      key={c}
                      onClick={() => { setCategoryFilter(c); setPage(1); setIsCatOpen(false); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                        ${categoryFilter === c
                          ? 'bg-[#3530B8] text-white font-bold'
                          : 'text-gray-700 hover:bg-indigo-50 hover:text-[#3530B8]'}`}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 상태 드롭다운 */}
            <div className="relative flex-1 lg:min-w-[8.125rem]" ref={statusRef}>
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#3530B8] transition-all flex items-center justify-between shadow-sm hover:border-gray-300"
              >
                <span className="truncate">{statusFilter === '전체' ? '모든 상태' : statusFilter}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isStatusOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden py-1">
                  {['전체', '재고 여유', '재고 부족', '재고 없음'].map(s => (
                    <div
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(1); setIsStatusOpen(false); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                        ${statusFilter === s
                          ? 'bg-[#3530B8] text-white font-bold'
                          : 'text-gray-700 hover:bg-indigo-50 hover:text-[#3530B8]'}`}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 선택 삭제 버튼 */}
            <button
              onClick={handleBulkDelete}
              disabled={checkedIds.length === 0}
              className={`flex items-center justify-center gap-1.5 px-5 py-2.5 border rounded-full text-sm font-bold transition-all flex-1 sm:flex-none
                ${checkedIds.length > 0
                  ? 'border-red-200 text-red-500 hover:bg-red-50 shadow-sm'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'}`}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
              <span className="hidden sm:inline">선택 삭제</span>
              {checkedIds.length > 0 && `(${checkedIds.length})`}
            </button>
          </div>
        </div>

        {/* ── 비품 목록 ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-x-auto custom-scrollbar">
          <div className="min-w-[56.25rem] flex-1 flex flex-col min-h-0">
            <div className="rounded-xl border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
            {/* 테이블 헤더 */}
            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 shrink-0">
              <div className="col-span-1 px-4 py-3 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && paginated.every(i => checkedIds.includes(i.id))}
                  onChange={toggleAll}
                  className="accent-indigo-600 w-4 h-4 cursor-pointer"
                />
              </div>
              {['비품명', '카테고리', '비품코드', '전체재고', ' 현재재고', '최소재고' ,'상태', '관리'].map((h, i) => (
                <div key={h} className={`py-3 text-[0.68rem] font-extrabold text-gray-400 uppercase tracking-wider
                  ${i === 0 ? 'col-span-2 px-4' 
                  : i === 1 ? 'col-span-2 px-4' 
                  : i === 2 ? 'col-span-2 px-4 text-center' 
                  : i === 3 ? 'col-span-1 px-4 text-center' 
                  : i === 4 ? 'col-span-1 px-4 text-center' 
                  : i === 5 ? 'col-span-1 px-4 text-center' 
                  : i === 6 ? 'col-span-1 px-4 text-center' 
                  : 'col-span-1 px-4 text-center'}`}>
                  {h}
                </div>
              ))}
            </div>

            {/* 테이블 바디 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
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
                    <div className="col-span-2 px-4 py-3.5">
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
                      <span className="text-sm font-bold text-gray-700">{item.minStockQty}</span>
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
          </div>
        </div>
      </div>

        <div className="shrink-0 pt-4">
          <AdminPagination count={Math.ceil(filtered.length / PER_PAGE)} page={page} onChange={(_, v) => setPage(v)} />
        </div>
      </div>
    </div>
  );
};

export default AdminSupply;
