import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-100">
      
      {/* 2. 기존 레이아웃에 h-screen 대신 w-[90%] h-[90%] 적용 */}
      {/* 팁: rounded-xl과 shadow-md를 주면 모서리가 둥근 고급스러운 대시보드 느낌이 납니다. */}
      <div className="flex w-[90%] h-[90%] bg-[#F8FAFC] overflow-hidden rounded-xl shadow-md border border-slate-200">
        
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex flex-col flex-1 min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}