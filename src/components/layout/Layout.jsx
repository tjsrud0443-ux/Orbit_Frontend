import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { getUsersInfo } from '../../api/userApi';

export default function Layout() {
  const navi = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUsersInfo().then(resp => {
      setUser(resp.data)
    })
    .catch(error => {
      alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      sessionStorage.removeItem("token");
      navi("/");
    })
  }, []);
  
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-100">

      <div className="flex w-[90%] h-[90%] bg-white overflow-hidden rounded-xl shadow-md border border-slate-200">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user}/>

        <div className="flex flex-col min-h-0 flex-1 min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} user={user}/>
          <main className="flex-1 overflow-hidden min-h-0 flex flex-col">
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}