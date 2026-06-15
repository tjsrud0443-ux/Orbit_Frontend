import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const TimePicker = ({ value, onChange, hasError, placeholder = "시간 선택", disableMinutes = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const selectedHour = value ? value.split(':')[0] : null;
  const selectedMinute = value ? value.split(':')[1] : null;

  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  const updatePos = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePos();
      window.addEventListener('resize', updatePos);
      window.addEventListener('scroll', updatePos, true);

      // 선택된 값으로 스크롤
      setTimeout(() => {
        if (hourRef.current && selectedHour) {
          const el = hourRef.current.querySelector(`[data-value="${selectedHour}"]`);
          if (el) el.scrollIntoView({ block: 'center' });
        }
        if (minuteRef.current && selectedMinute) {
          const el = minuteRef.current.querySelector(`[data-value="${selectedMinute}"]`);
          if (el) el.scrollIntoView({ block: 'center' });
        }
      }, 50);
    }
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!inputRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (type, val) => {
    const currentHour = selectedHour || '00';
    const currentMinute = selectedMinute || '00';
    if (type === 'hour') onChange(`${val}:${disableMinutes ? '00' : currentMinute}`);
    else if (!disableMinutes) onChange(`${currentHour}:${val}`);
  };

  return (
    <>
      <button
        ref={inputRef}
        type="button"
        onClick={() => { setIsOpen(!isOpen); updatePos(); }}
        className={`w-full border rounded-2xl px-4 py-3 bg-white text-sm font-bold text-left transition-all flex items-center justify-between gap-2
          ${hasError ? 'border-red-400 ring-4 ring-red-100 text-red-400' : value ? 'border-gray-300 text-gray-700 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100' : 'border-gray-300 text-gray-400'}`}
      >
        <span>{value || placeholder}</span>
        <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden"
          style={{ top: `${dropdownPos.top + 4}px`, left: `${dropdownPos.left}px`, width: '160px' }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
            <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider">시간 선택</span>
            <span className="text-sm font-bold text-indigo-950">{value || '--:--'}</span>
          </div>

          {/* 컬럼 헤더 */}
          <div className="grid grid-cols-2 border-b border-gray-50">
            <div className="text-center py-1.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider border-r border-gray-50">시</div>
            <div className="text-center py-1.5 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">분</div>
          </div>

          {/* 시/분 선택 */}
          <div className="grid grid-cols-2" style={{ height: '180px' }}>
            {/* 시 */}
            <div ref={hourRef} className="overflow-y-auto border-r border-gray-50 custom-scrollbar">
              {hours.map(h => (
                <div
                  key={h}
                  data-value={h}
                  onClick={() => handleSelect('hour', h)}
                  className={`text-center py-2 text-sm font-bold cursor-pointer transition-colors
                    ${selectedHour === h
                      ? 'bg-[#DDE8FF] text-indigo-700'
                      : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* 분 */}
            <div ref={minuteRef} className="overflow-y-auto custom-scrollbar">
              {minutes.map(m => (
                <div
                  key={m}
                  data-value={m}
                  onClick={() => handleSelect('minute', m)}
                  className={`text-center py-2 text-sm font-bold transition-colors
                    ${disableMinutes && m !== '00' 
                      ? 'text-gray-200 cursor-not-allowed' 
                      : selectedMinute === m
                        ? 'bg-[#DDE8FF] text-indigo-700'
                        : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* 확인 버튼 */}
          <div className="px-3 py-2.5 border-t border-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 bg-[#DDE8FF] text-indigo-700 text-xs font-bold rounded-xl hover:bg-[#C5D8FF] text-indigo-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default TimePicker;
