import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGripVertical,
  faPenToSquare,
  faPlus,
  faTimes,
  faTrashCan
} from '@fortawesome/free-solid-svg-icons';
import { getRankList } from './adminApi';
import { alertConfirm, alertSuccess } from '../../utils/alert';
import useLoadingStore from '../../store/useLoadingStore';

const getRankKey = (rank, fallback) => rank?.rank_seq ?? rank?.rankSeq ?? rank?.id ?? fallback;
const getRankName = (rank) => rank?.rank_name ?? rank?.rankName ?? '';
const getRankOrder = (rank, fallback) => Number(rank?.rank_order ?? rank?.rankOrder ?? fallback);

const normalizeRankList = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.rankList)
        ? payload.rankList
        : Array.isArray(payload?.ranks)
          ? payload.ranks
          : [];

  return [...list]
    .sort((a, b) => getRankOrder(a, 9999) - getRankOrder(b, 9999))
    .map((rank, index) => ({
      ...rank,
      rank_order: index + 1,
      rankOrder: index + 1
    }));
};

const reorderRanks = (list) => list.map((rank, index) => ({
  ...rank,
  rank_order: index + 1,
  rankOrder: index + 1
}));

const AdminRank = () => {
  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);
  const panelRef = useRef(null);
  const dragIndexRef = useRef(null);
  const touchDragIndexRef = useRef(null);
  const touchDropIndexRef = useRef(null);

  const [ranks, setRanks] = useState([]);
  const [formMode, setFormMode] = useState(null);
  const [formData, setFormData] = useState({ rank_name: '' });
  const [selectedRank, setSelectedRank] = useState(null);
  const [errors, setErrors] = useState({});
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    const fetchRanks = async () => {
      showLoading();
      try {
        const resp = await getRankList();
        setRanks(normalizeRankList(resp.data));
      } catch (error) {
        console.error('직급 목록 로딩 실패', error);
      } finally {
        hideLoading();
      }
    };

    fetchRanks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isTrigger = event.target.closest('.rank-action-trigger');
      if (panelRef.current && !panelRef.current.contains(event.target) && !isTrigger) {
        handleCloseForm();
      }
    };

    if (formMode) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [formMode]);

  const openCreate = () => {
    setFormMode('CREATE');
    setFormData({ rank_name: '' });
    setSelectedRank(null);
    setErrors({});
  };

  const openEdit = (rank) => {
    setFormMode('EDIT');
    setSelectedRank(rank);
    setFormData({ rank_name: getRankName(rank) });
    setErrors({});
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setSelectedRank(null);
    setFormData({ rank_name: '' });
    setErrors({});
  };

  const handleSave = async () => {
    const rankName = formData.rank_name.trim();

    if (!rankName) {
      setErrors({ rank_name: '직급명을 입력해주세요.' });
      return;
    }

    const hasDuplicateName = ranks.some(rank =>
      getRankName(rank) === rankName && getRankKey(rank) !== getRankKey(selectedRank)
    );

    if (hasDuplicateName) {
      setErrors({ rank_name: '이미 존재하는 직급명입니다.' });
      return;
    }

    if (formMode === 'EDIT') {
      setRanks(prev => prev.map(rank =>
        getRankKey(rank) === getRankKey(selectedRank)
          ? { ...rank, rank_name: rankName, rankName }
          : rank
      ));
      await alertSuccess('수정 완료', '직급 정보가 화면에 반영되었습니다.');
    } else {
      setRanks(prev => reorderRanks([
        ...prev,
        {
          rank_seq: `temp-${Date.now()}`,
          rank_name: rankName,
          rankName,
          rank_order: prev.length + 1,
          rankOrder: prev.length + 1
        }
      ]));
      await alertSuccess('추가 완료', '직급 정보가 화면에 반영되었습니다.');
    }

    handleCloseForm();
  };

  const handleDelete = async (rank) => {
    const result = await alertConfirm(
      `[ ${getRankName(rank)} ] 직급을 삭제하시겠습니까?`,
      '현재 화면에서만 삭제되며 저장 API는 호출하지 않습니다.'
    );

    if (!result.isConfirmed) return;

    setRanks(prev => reorderRanks(prev.filter(item => getRankKey(item) !== getRankKey(rank))));
    await alertSuccess('삭제 완료', '직급 정보가 화면에 반영되었습니다.');
  };

  const handleDragStart = (event, index) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (event, dropIndex) => {
    event.preventDefault();
    const sourceIndex = dragIndexRef.current;

    if (sourceIndex === null || sourceIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    setRanks(prev => {
      const nextRanks = [...prev];
      const [movedRank] = nextRanks.splice(sourceIndex, 1);
      nextRanks.splice(dropIndex, 0, movedRank);
      return reorderRanks(nextRanks);
    });

    handleDragEnd();
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleTouchStart = (event, index) => {
    touchDragIndexRef.current = index;
    touchDropIndexRef.current = index;
    setDraggingIndex(index);
    setDragOverIndex(index);
  };

  const handleTouchMove = (event) => {
    if (touchDragIndexRef.current === null) return;

    event.preventDefault();

    const touch = event.touches[0];
    const targetRow = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest('[data-rank-index]');

    if (!targetRow) return;

    const targetIndex = Number(targetRow.dataset.rankIndex);
    if (!Number.isNaN(targetIndex)) {
      touchDropIndexRef.current = targetIndex;
      setDragOverIndex(targetIndex);
    }
  };

  const handleTouchEnd = () => {
    const sourceIndex = touchDragIndexRef.current;
    const dropIndex = touchDropIndexRef.current;

    if (sourceIndex !== null && dropIndex !== null && sourceIndex !== dropIndex) {
      setRanks(prev => {
        const nextRanks = [...prev];
        const [movedRank] = nextRanks.splice(sourceIndex, 1);
        nextRanks.splice(dropIndex, 0, movedRank);
        return reorderRanks(nextRanks);
      });
    }

    touchDragIndexRef.current = null;
    touchDropIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-full overflow-hidden">
      <div className="p-6 md:p-8 lg:p-10 md:pb-4 md:px-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
        <div className="space-y-1.5">
          <h1 className="text-xl md:text-2xl font-bold text-[#1a1c3d] tracking-tight">직급 관리</h1>
          <p className="text-[11px] md:text-sm text-[#8a92a6] font-medium">직급을 추가하고 조직 내 직급 순서를 관리합니다.</p>
        </div>
        <div className="flex justify-end gap-3 shrink-0">
          <button
            onClick={openCreate}
            className="rank-action-trigger px-3 sm:px-4 py-2.5 bg-[#3530B8] text-white rounded-xl text-[11px] sm:text-xs font-bold hover:bg-[#2a2594] transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-100 cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <FontAwesomeIcon icon={faPlus} /> 직급 추가
          </button>
        </div>
      </div>

      <div className="flex-1 flex px-6 md:px-8 lg:px-10 pb-6 md:pb-8 lg:pb-10 gap-6 overflow-hidden">
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-500">
          <div className="overflow-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse min-w-0 md:min-w-[560px] table-fixed text-[#1a1c3d]">
              <thead className="sticky top-0 z-20 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 md:py-4 pl-4 md:pl-6 pr-2 md:pr-4 w-[28%] md:w-[22%]">순서</th>
                  <th className="py-3 md:py-4 px-2 md:px-4 w-[42%] md:w-[48%]">직급명</th>
                  <th className="py-3 md:py-4 pl-2 md:pl-4 pr-4 md:pr-20 w-[30%] text-right whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ranks.length > 0 ? ranks.map((rank, index) => {
                  const key = getRankKey(rank, index);
                  const isDragging = draggingIndex === index;
                  const isDropTarget = dragOverIndex === index && draggingIndex !== index;

                  return (
                    <tr
                      key={key}
                      data-rank-index={index}
                      draggable
                      onDragStart={(event) => handleDragStart(event, index)}
                      onDragOver={(event) => handleDragOver(event, index)}
                      onDrop={(event) => handleDrop(event, index)}
                      onDragEnd={handleDragEnd}
                      className={`group border-b border-slate-100 transition-all ${isDragging ? 'opacity-45' : 'opacity-100'} ${isDropTarget ? 'bg-[#F0F4FF] shadow-[inset_4px_0_0_#3530B8]' : 'hover:bg-slate-50/60'}`}
                    >
                      <td className="py-3.5 md:py-4 pl-4 md:pl-6 pr-2 md:pr-4">
                        <div className="flex items-center gap-2 md:gap-4">
                          <span
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 group-hover:text-[#3530B8] group-hover:bg-indigo-50 flex items-center justify-center cursor-grab active:cursor-grabbing transition-all shrink-0 touch-none"
                            onTouchStart={(event) => handleTouchStart(event, index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                          >
                            <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
                          </span>
                          <span className="text-sm font-bold text-slate-600">{rank.rank_order ?? index + 1}</span>
                        </div>
                      </td>
                      <td className="py-3.5 md:py-4 px-2 md:px-4">
                        <span className="block text-sm font-bold text-slate-700 truncate">{getRankName(rank)}</span>
                      </td>
                      <td className="py-3.5 md:py-4 pl-2 md:pl-4 pr-4 md:pr-20 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(rank)}
                            className="rank-action-trigger w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                            title="수정"
                          >
                            <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(rank)}
                            className="rank-action-trigger w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                            title="삭제"
                          >
                            <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="3" className="py-20 text-center text-slate-300 italic text-sm">등록된 직급 정보가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {formMode && (
          <div
            className="fixed inset-0 z-30 bg-[#1a1c3d]/45 backdrop-blur-sm md:hidden"
            onClick={handleCloseForm}
          />
        )}

        <aside
          ref={panelRef}
          className={`admin-rank-form-panel bg-white border border-slate-200 rounded-2xl shadow-xl z-40 transition-all duration-500 ease-in-out flex flex-col overflow-hidden
            ${formMode
              ? 'fixed left-1/2 top-1/2 w-[calc(100vw-32px)] max-w-sm opacity-100 -translate-x-1/2 -translate-y-1/2 md:static md:left-auto md:top-auto md:w-[320px] lg:w-[380px] md:max-w-none md:translate-x-0 md:translate-y-0 md:ml-0 md:self-start'
              : 'fixed left-1/2 top-1/2 w-[calc(100vw-32px)] max-w-sm opacity-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none md:static md:left-auto md:top-auto md:w-0 md:max-w-none md:translate-x-10 md:translate-y-0 md:ml-[-24px] md:self-start'}
          `}
          style={{ height: formMode ? '360px' : '0', maxHeight: 'calc(100vh - 48px)', minHeight: formMode ? '320px' : '0' }}
        >
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <h2 className="text-base font-bold text-slate-800">{formMode === 'EDIT' ? '직급 수정' : '직급 추가'}</h2>
            <button onClick={handleCloseForm} className="w-8 h-8 rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all flex items-center justify-center cursor-pointer">
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">직급명</label>
              <input
                type="text"
                placeholder="예: 과장"
                maxLength={20}
                className={`w-full h-10 px-3 bg-slate-50 border ${errors.rank_name ? 'border-red-500' : 'border-slate-200'} rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3530B8]/20 focus:border-[#3530B8] transition-all`}
                value={formData.rank_name}
                onChange={(event) => {
                  setFormData({ rank_name: event.target.value });
                  if (errors.rank_name) setErrors({});
                }}
              />
              {errors.rank_name && <p className="text-[9px] text-red-500 font-medium ml-1">{errors.rank_name}</p>}
              <div className="flex justify-end text-[9px] text-slate-400 font-medium ml-1">
                <span>{formData.rank_name.length}/20</span>
              </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex gap-2 shrink-0 mt-auto">
            <button onClick={handleCloseForm} className="flex-1 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer">취소</button>
            <button onClick={handleSave} className="flex-[1.5] h-10 bg-[#3530B8] text-white rounded-xl text-xs font-bold hover:bg-[#2a2594] transition-all shadow-md shadow-indigo-100 cursor-pointer">저장하기</button>
          </div>
        </aside>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar:horizontal { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
      `}</style>
    </div>
  );
};

export default AdminRank;
