import { Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getUsersInfo } from '../../api/userApi';
import useUserStore from '../../store/userStore';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const setUserInfo = useUserStore(state => state.setUser);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const resp = await getUsersInfo();
        setUserInfo(resp.data);
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    };

    fetchUserInfo();
  }, [setUserInfo]);

  return (
    <div id="layout-root" className="w-screen h-screen flex items-center justify-center bg-slate-100">

      <div id="layout-inner" className="flex w-[90%] h-[90%] bg-white overflow-hidden rounded-xl shadow-md border border-slate-200">

        <div className="no-print">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        <div className="flex flex-col min-h-0 flex-1 min-w-0">
          <div className="no-print">
            <Header onMenuClick={() => setSidebarOpen(true)} />
          </div>
          <main id="main-content" className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}