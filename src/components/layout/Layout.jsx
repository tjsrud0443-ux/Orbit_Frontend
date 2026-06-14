import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getUsersInfo } from '../../api/userApi';
import useUserStore from '../../store/userStore';
import { alertWarning } from '../../utils/alert';

export default function Layout() {
  const navi = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const setUserInfo = useUserStore(state => state.setUser);

  useEffect(() => {
    getUsersInfo().then(resp => {
      setUserInfo(resp.data)
    })
    .catch(error => {
      alertWarning('세션 만료', '로그인 세션이 만료되었습니다.<br> 다시 로그인해주세요.');
      sessionStorage.removeItem("token");
      navi("/");
    })
  }, []);
  
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-100">

      <div className="flex w-[90%] h-[90%] bg-white overflow-hidden rounded-xl shadow-md border border-slate-200">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-col min-h-0 flex-1 min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}