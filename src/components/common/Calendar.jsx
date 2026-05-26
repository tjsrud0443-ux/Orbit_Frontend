import { useState } from 'react';

const Calendar = ({ value, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const calendarYear = viewDate.getFullYear();
  const calendarMonth = viewDate.getMonth();
  
  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const lastDate = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= lastDate; i++) calendarDays.push(i);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const handleDateSelect = (e, day) => {
    e.stopPropagation();
    if (!day) return;
    
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    onClose();
  };

  return (
    <div className="absolute z-30 w-full bottom-full mb-1 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between 2 px-0">
        <button 
          onClick={handlePrevMonth} 
          className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#3530B8] transition-colors"
        >
          &lt;
        </button>
        <div className="text-xs font-bold text-gray-900">
          {calendarYear}년 {calendarMonth + 1}월
        </div>
        <button 
          onClick={handleNextMonth} 
          className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#3530B8] transition-colors"
        >
          &gt;
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(d => (
          <div key={d} className="text-[0.625rem] font-bold text-gray-400 text-center py-1">
            {d}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((d, i) => {
          const currentFormatted = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSelected = value === currentFormatted;

          return (
            <div 
              key={i}
              onClick={(e) => handleDateSelect(e, d)}
              className={`text-[0.625rem] font-medium text-center py-1 rounded-lg transition-all cursor-pointer
                ${!d ? 'invisible' : 'hover:bg-[#F0F4FF] hover:text-[#3530B8] text-gray-600'}
                ${isSelected ? 'bg-[#3530B8] text-white' : ''}
              `}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;