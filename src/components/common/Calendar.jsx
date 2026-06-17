import { useState } from 'react';

const Calendar = ({ value, onChange, onClose, isStatic = false, events = [], onMonthChange }) => {
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
    const newDate = new Date(calendarYear, calendarMonth - 1, 1);
    setViewDate(newDate);
    if (onMonthChange) {
      const ym = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
      onMonthChange(ym);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    const newDate = new Date(calendarYear, calendarMonth + 1, 1);
    setViewDate(newDate);
    if (onMonthChange) {
      const ym = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
      onMonthChange(ym);
    }
  };

  const handleDateSelect = (e, day) => {
    e.stopPropagation();
    if (!day) return;
    
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (!isStatic) {
      const date = new Date(calendarYear, calendarMonth, day);
      const dayOfWeek = date.getDay(); // 0: Sunday, 6: Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) return;
      
      onChange(dateStr);
      onClose();
    } else {
      // For static main calendar, we just call onChange (which might be handleDateClick)
      onChange({ dateStr });
    }
  };

  const containerClasses = isStatic 
    ? "w-full h-full bg-white flex flex-col" 
    : "absolute z-30 w-full bottom-full mb-1 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-200";

  return (
    <div className={containerClasses}>
      <div className={`flex items-center justify-between px-1 ${isStatic ? 'mb-4' : 'mb-2'}`}>
        <button 
          onClick={handlePrevMonth} 
          className="p-1 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-[#3530B8] transition-colors"
        >
          &lt;
        </button>
        <div className={`${isStatic ? 'text-sm' : 'text-xs'} font-bold text-gray-900`}>
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
          <div key={d} className={`font-bold text-gray-400 text-center py-1 ${isStatic ? 'text-xs' : 'text-[0.625rem]'}`}>
            {d}
          </div>
        ))}
      </div>
      
      <div className={`grid grid-cols-7 gap-1 flex-1 ${isStatic ? 'content-between' : ''}`}>
        {calendarDays.map((d, i) => {
          const currentFormatted = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isSelected = value === currentFormatted;
          const isToday = d && new Date().toISOString().split('T')[0] === currentFormatted;
          
          let isWeekend = false;
          if (d) {
            const date = new Date(calendarYear, calendarMonth, d);
            const dayOfWeek = date.getDay();
            isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          }

          // Check for events on this day (supporting multi-day and colored dots)
          const dayEvents = events.filter(e => {
            if (!e) return false;
            const eStart = (typeof e === 'string' ? e : (e.start?.split('T')[0]?.split(' ')[0] || e.start));
            const eEnd = (typeof e === 'string' ? e : (e.originalEnd || e.end || eStart).split('T')[0]?.split(' ')[0]);
            return currentFormatted >= eStart && currentFormatted <= eEnd;
          });

          return (
            <div 
              key={i}
              onClick={(e) => (!isWeekend || isStatic) && handleDateSelect(e, d)}
              className={`font-medium text-center py-1 rounded-lg transition-all relative flex flex-col items-center justify-center
                ${!d ? 'invisible' : (isWeekend && !isStatic) ? 'text-gray-300 cursor-not-allowed opacity-50' : 'hover:bg-[#F0F4FF] hover:text-[#3530B8] text-gray-600 cursor-pointer'}
                ${isSelected ? 'bg-[#3530B8] text-white' : isToday ? 'text-[#3530B8] font-bold' : ''}
                ${isStatic ? 'text-xs h-8 sm:h-10' : 'text-[0.625rem]'}
              `}
            >
              <span>{d}</span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 justify-center">
                  {dayEvents.slice(0, 4).map((e, idx) => (
                    <div 
                      key={idx} 
                      className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : ''}`}
                      style={{ backgroundColor: isSelected ? undefined : (typeof e === 'object' && e.color ? e.color : '#3530B8') }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;