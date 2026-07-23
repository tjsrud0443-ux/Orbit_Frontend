import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faXmark, faGripLines } from '@fortawesome/free-solid-svg-icons';
import { alertSuccess, alertError } from '../../utils/alert';
const MAX_SELECTED = 9;

const QuickActionEditModal = ({ allActions, hasAccess, currentOrder, onClose, onSave }) => {
  const [isMobile, setIsMobile] = useState(window.matchMedia("(max-width:768px)").matches);
  const [selectedKeys, setSelectedKeys] = useState(
    currentOrder.split(',').filter(key => allActions[key] && hasAccess(allActions[key]))
  );
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width:768px)");
    const handler = (e) => setIsMobile(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const availableKeys = Object.keys(allActions).filter(key => hasAccess(allActions[key]));

  const toggleKey = (key) => {
    setSelectedKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      if (prev.length >= MAX_SELECTED) {
        alertError('선택 제한', `빠른 실행은 최대 ${MAX_SELECTED}개까지 선택할 수 있습니다.`);
        return prev;
      }
      return [...prev, key];
    });
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    setSelectedKeys(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx) => {
    setSelectedKeys(prev => {
      if (idx === prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  // PC 전용: 드래그 앤 드롭 핸들러
  const handleDragStart = (idx) => setDraggedIdx(idx);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setSelectedKeys(prev => {
      const next = [...prev];
      const [moved] = next.splice(draggedIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => setDraggedIdx(null);

  const handleSave = () => {
    if (selectedKeys.length === 0) {
      alertError('선택 필요', '최소 1개 이상의 항목을 선택해주세요.');
      return;
    }
    const orderString = selectedKeys.join(',');
    onSave(orderString);
    alertSuccess('저장 완료', '빠른실행 설정이 저장되었습니다.');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900">빠른 실행 편집</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2">
               선택된 항목 ({selectedKeys.length}/{MAX_SELECTED}) {isMobile ? '(순서 조절)' : '(드래그로 순서 조절)'}
            </h3>
            {selectedKeys.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">선택된 항목이 없습니다.</p>
            ) : (
              <div className="space-y-1.5">
                {selectedKeys.map((key, idx) => (
                  <div
                    key={key}
                    draggable={!isMobile}
                    onDragStart={() => !isMobile && handleDragStart(idx)}
                    onDragOver={(e) => !isMobile && handleDragOver(e, idx)}
                    onDragEnd={() => !isMobile && handleDragEnd()}
                    className={`flex items-center justify-between px-3 py-2 bg-[#F0F4FF] rounded-xl transition-opacity
                      ${!isMobile ? 'cursor-move' : ''}
                      ${draggedIdx === idx ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      {!isMobile && (
                        <FontAwesomeIcon icon={faGripLines} className="w-3 h-3 text-slate-300" />
                      )}
                      <span className="text-sm font-semibold text-[#3530B8]">{allActions[key].title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMobile && (
                        <>
                          <button onClick={() => moveUp(idx)} disabled={idx === 0}
                            className="p-1.5 text-slate-400 hover:text-[#3530B8] disabled:opacity-30 disabled:cursor-not-allowed">
                            <FontAwesomeIcon icon={faArrowUp} className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveDown(idx)} disabled={idx === selectedKeys.length - 1}
                            className="p-1.5 text-slate-400 hover:text-[#3530B8] disabled:opacity-30 disabled:cursor-not-allowed">
                            <FontAwesomeIcon icon={faArrowDown} className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button onClick={() => toggleKey(key)}
                        className="p-1.5 text-slate-400 hover:text-red-500">
                        <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 mb-2">전체 항목</h3>
            <div className="grid grid-cols-2 gap-2">
              {availableKeys.map(key => {
                const isSelected = selectedKeys.includes(key);
                const isDisabled = !isSelected && selectedKeys.length >= MAX_SELECTED;
                return (
                    <button
                    key={key}
                    onClick={() => toggleKey(key)}
                    disabled={isDisabled}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all text-left
                        ${isSelected
                        ? 'bg-[#3530B8] text-white border-[#3530B8]'
                        : isDisabled
                            ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-slate-600 border-gray-200 hover:border-[#3530B8]'
                        }`}
                    >
                    {allActions[key].title}
                    </button>
                );
                })}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-50 flex gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all">
            취소
          </button>
          <button onClick={handleSave}
            className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#3530B8]/20 hover:bg-[#2a2696] transition-all">
            저장
          </button>
        </div>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
        `}</style>
      </div>
    </div>
  );
};

export default QuickActionEditModal;