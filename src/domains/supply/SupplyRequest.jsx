import React, { useState, useRef, useEffect } from 'react';
import useUserStore from '../../store/userStore';
import Calendar from '../../components/common/Calendar';
import { getSupplies,supplyRequest } from './supplyApi';
import { alertSuccess, alertError } from '../../utils/alert';
import { useNavigate } from 'react-router-dom';

// 비품 전체 카테고리
const CATEGORIES = ['전체', '사무용품', '전자기기', '가구', '네트워크 장비'];
// ── 비품 추가 모달 ──────────────────────────────────────────────
const USAGE_TYPES = ['개발용', '일반용', '교체용'];

const AddItemModal = ({ onAdd, onClose }) => {
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('전체'); // 카테고리 상태 추가
  const [catalog, setCatalog] = useState([]);
  const [qty, setQty] = useState(1);
  const [usageType, setUsageType] = useState('개발용');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getSupplies().then(resp => {
      setCatalog(resp.data)
    });
  }, []);
  
  // 카테고리 필터링 + 검색어 필터링을 동시에 처리
  const filtered = catalog.filter(item => {
    // 1. 카테고리 조건 체크
    const matchesCategory = currentCategory === '전체' || item.category === currentCategory; 
    // 2. 검색어 조건 체크
    const matchesKeyword = item.supply_name.toLowerCase().includes(keyword.toLowerCase()) || 
                           item.supply_code.toLowerCase().includes(keyword.toLowerCase());
    return matchesCategory && matchesKeyword;
  });

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    //외부 클릭 감지는 React 이벤트 시스템만으로는 처리가 어려워서 DOM 직접 접근이 불가피
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    setSelected(item);
    // setKeyword(item.supply_name);
    setKeyword('');
    setIsDropdownOpen(false);
  };

  const handleAdd = () => {
    if (!selected) return;
    onAdd({ ...selected, qty, usageType, id: Date.now() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-7">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-extrabold text-gray-900">비품 추가</h2>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* 2. 카테고리 선택 칩 영역 배치 */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">
            카테고리 분류
          </label>
          <div className="flex flex-wrap gap-1 md:gap-1.5 justify-center md:justify-start">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCurrentCategory(cat);
                  setSelected(null); // 카테고리 바꾸면 선택했던 품목 해제
                  setIsDropdownOpen(true); // 편의성을 위해 드롭다운 즉시 열기
                }}
                className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full transition-all whitespace-nowrap
                  ${currentCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 비품 검색 */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">
            비품 검색
          </label>
          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={keyword}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={e => { 
                setKeyword(e.target.value); 
                setSelected(null);
                setIsDropdownOpen(true);
              }}
              placeholder="비품명 또는 규격/모델 검색"
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-600/5 transition-all"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>

            {/* 검색 드롭다운 */}
            {isDropdownOpen && filtered.length > 0 && !selected && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar py-2">
                <style>{`
                  .custom-scrollbar::-webkit-scrollbar {
                    width: 10px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E7EB;
                    border: 3px solid transparent;
                    background-clip: padding-box;
                    border-radius: 10px;
                  }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D1D5DB;
                    border: 3px solid transparent;
                    background-clip: padding-box;
                  }
                `}</style>
                {filtered.map(item => (
                  <div
                    key={item.supply_seq}
                    onClick={() => handleSelect(item)}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-700">{item.supply_name}</p>
                      <p className="text-[11px] text-gray-400">{item.supply_code}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* 아무 검색 결과도 없을 때 보여줄 UI */}
            {isDropdownOpen && filtered.length === 0 && !selected && (
              <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-6 text-center text-xs text-gray-400 font-medium">
                일치하는 비품이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 비품 정보 */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">
            비품 정보
          </label>
          <div className={`px-4 py-3 border rounded-xl min-h-[60px] transition-all ${selected ? 'border-gray-200 bg-gray-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
            {selected ? (
              <div>
                <p className="text-sm font-bold text-gray-700">{selected.supply_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{selected.supply_code} </p>
              </div>
            ) : (
              <p className="text-sm text-gray-300">검색 후 비품을 선택하면 정보가 표시됩니다.</p>
            )}
          </div>
        </div>

        {/* 수량 */}
        <div className="flex flex-col gap-1.5 mb-5">
          <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">
            수량 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-base"
            >−</button>
            <span className="text-sm font-bold text-gray-800 w-8 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-base"
            >+</button>
          </div>
        </div>

        {/* 사용 구분 */}
        <div className="flex flex-col gap-1.5 mb-7">
          <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">
            사용 구분 <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-5">
            {USAGE_TYPES.map(type => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="usageType"
                  value={type}
                  checked={usageType === type}
                  onChange={() => setUsageType(type)}
                  className="accent-indigo-600 w-4 h-4"
                />
                <span className="text-sm text-gray-600 font-medium">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 bg-white hover:bg-gray-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all
              ${selected
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100'
                : 'bg-indigo-300 cursor-not-allowed'
              }`}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
};

// ── 메인 페이지 ────────────────────────────────────────────────
const SupplyRequest = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
})();

  const [reqDate, setReqDate] = useState(today);
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  const changeQty = (id, delta) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleAddItem = (item) => {
    setItems(prev => [...prev, item]);
    if (errors.items) setErrors(prev => ({ ...prev, items: false }));
  };

    //외부 클릭시 달력 닫기
  useEffect(() => {
      const handleClickOutside = (e) => {
          if (calendarRef.current && !calendarRef.current.contains(e.target)) {
              setShowCalendar(false);
          }
      };
      if (showCalendar) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const validate = () => {
    const e = {};
    if (!reason.trim()) e.reason = true;
    if (items.length === 0) e.items = true;
    if (reqDate < today) e.reqDate = true;
    setErrors(e);
    //에러가 하나도 없으면 true 반환
    return Object.keys(e).length === 0;
  };

  //오늘 이전은 선택 불가
  const handleDateChange = (date) => {
    if (date < today) {
        setErrors(prev => ({ ...prev, reqDate: true }));
        return;
    }
    setErrors(prev => ({ ...prev, reqDate: false }));
    setReqDate(date);
    setShowCalendar(false);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // TODO: API 연동
     supplyRequest({
        reason: reason,
        status: 'PENDING',
        req_date: reqDate,
        items: items.map(item => ({
            supply_seq: item.supply_seq,
            ea: item.qty,
            use_type: item.usageType
        }))
    }).then(async () => {
        await alertSuccess('신청 완료', '비품 신청이 완료되었습니다.');
        navigate('/supplyHistory');
    }).catch(() => {
        alertError('오류 발생', '비품 신청 중 오류가 발생했습니다.');
    });
  };

  const handleCancel = () => {
    setReason('');
    setItems([]);
    setReqDate(today);
    setErrors({});
  };

  return (
    <div className="w-full h-full bg-white p-4 md:p-8 lg:px-10 font-sans flex flex-col overflow-hidden no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 비품 추가 모달 */}
      {showModal && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* 페이지 헤더 */}
      <div className="mb-4 shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">비품 신청</h1>
        <p className="text-[0.75rem] md:text-[0.82rem] text-gray-500">업무에 필요한 비품을 신청합니다.</p>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 w-full flex-1 flex flex-col overflow-hidden mb-2 min-h-0">

        {/* 신청자 / 신청일 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 shrink-0">
          <div className="flex flex-col gap-1">
            <label className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider">
              신청자
            </label>
            <input
              type="text"
              readOnly
              value={user ? `${user.name} ${user.position || ''} (${user.dept_name || ''})` : ''}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-400 bg-gray-50 outline-none"
            />
          </div>
          <div className="flex flex-col gap-1 relative">
            <label className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider">
              수령 희망 날짜
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={reqDate}
                onClick={() => setShowCalendar(!showCalendar)}
                className={`w-full px-3 py-1.5 border rounded-xl text-xs md:text-sm text-gray-700 outline-none focus:ring-4 transition-all cursor-pointer bg-white
                ${errors.reqDate
                  ? 'border-red-400 ring-4 ring-red-100'
                  : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-600/5'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              {showCalendar && (               
                <div ref={calendarRef}
                  className="absolute top-full left-0 w-full z-40 [&>div]:top-0 [&>div]:bottom-auto [&>div]:mt-1 [&>div]:mb-0">
                  <Calendar 
                    value={reqDate} 
                    onChange={handleDateChange} 
                    onClose={() => setShowCalendar(false)} 
                  />                 
                </div>
              )}
            </div>
             {errors.reqDate && (
                <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1">
                    오늘 이후 날짜를 선택해주세요.
                </p>
              )}
          </div>
        </div>

        {/* 요청 사유 */}
        <div className="flex flex-col gap-1 mb-3 shrink-0">
          <label className="text-[0.65rem] font-extrabold text-gray-400 uppercase tracking-wider">
            요청 사유 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => {
              if (e.target.value.length > 40) return;
              setReason(e.target.value);
              if (errors.reason) setErrors(prev => ({ ...prev, reason: false }));
            }}
            placeholder="요청 사유를 입력해주세요."
            rows={2}
            className={`px-3 py-1.5 border rounded-xl text-xs md:text-sm text-gray-700 outline-none resize-none transition-all
              ${errors.reason
                ? 'border-red-400 ring-4 ring-red-100'
                : 'border-gray-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-600/5'
              }`}
          />
          <div className="flex justify-between items-center px-0.5">
            {errors.reason ? (
              <p className="text-[10px] text-red-500 font-bold">요청 사유를 입력해주세요.</p>
            ) : (
              <div />
            )}
            <p className={`text-[10px] ${reason.length >= 40 ? 'text-red-400' : 'text-gray-400'} font-medium`}>
              {reason.length}/40
            </p>
          </div>
        </div>

        {/* 비품 목록 헤더 */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-xs md:text-sm font-extrabold text-indigo-950">신청 비품 목록</span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-lg text-[10px] md:text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 hover:border-indigo-300 transition-all"
          >
            + 추가
          </button>
        </div>

        {/* 테이블 */}
        <div className={`border rounded-xl overflow-hidden ${errors.items ? 'border-red-300' : 'border-gray-100'} flex-1 flex flex-col min-h-0`}>
          {/* 가로 스크롤을 위한 컨테이너 추가 */}
          <div className="flex-1 flex flex-col min-w-full overflow-x-auto no-scrollbar">
            <div className="min-w-[500px] flex-1 flex flex-col">
              <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 shrink-0">
                <div className="col-span-5 px-3 py-1.5 text-[0.6rem] font-extrabold text-gray-400 uppercase tracking-wider">품목</div>
                <div className="col-span-3 px-3 py-1.5 text-[0.6rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">수량</div>
                <div className="col-span-3 px-3 py-1.5 text-[0.6rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">용도</div>
                <div className="col-span-1 px-3 py-1.5 text-[0.55rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">삭제</div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {items.length > 0 ? (
                  items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/60 transition-colors">
                      <div className="col-span-5 px-3 py-1.5">
                        <p className="text-xs text-gray-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.supply_name}</p>
                        <p className="text-[10px] text-gray-400 whitespace-nowrap">{item.supply_code}</p>
                      </div>
                      <div className="col-span-3 px-3 py-1.5 flex items-center justify-center">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => changeQty(item.id, -1)}
                            className="w-5 h-5 flex items-center justify-center border border-gray-200 rounded-md text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs"
                          >−</button>
                          <span className="text-xs font-bold text-gray-800 w-4 text-center">{item.qty}</span>
                          <button
                            onClick={() => changeQty(item.id, 1)}
                            className="w-5 h-5 flex items-center justify-center border border-gray-200 rounded-md text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs"
                          >+</button>
                        </div>
                      </div>
                      <div className="col-span-3 px-3 py-1.5 text-center">
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 whitespace-nowrap">
                          {item.usageType}
                        </span>
                      </div>
                      <div className="col-span-1 px-3 py-1.5 flex items-center justify-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center text-xs text-gray-400 font-bold py-8">
                    비품을 추가해주세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {errors.items && (
          <p className="text-[10px] text-red-500 font-bold mt-0.5 ml-1 shrink-0">비품을 1개 이상 추가해주세요.</p>
        )}

        {/* 버튼 */}
        <div className="flex justify-end gap-2 mt-3 shrink-0">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 bg-white hover:bg-gray-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl hover:bg-[#4F4DD0] shadow-md shadow-indigo-100 transition-all"
          >
            신청
          </button>
        </div>

      </div>
    </div>
  );
};

export default SupplyRequest;
