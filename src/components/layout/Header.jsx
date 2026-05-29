import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import useAuthStore from '../../store/authStore';
import useUserStore from '../../store/userStore';

const Header = ({ onMenuClick }) => {
  const token = useAuthStore(state => state.token);
  const user = useUserStore(state => state.user);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center
      justify-between lg:justify-end px-4 lg:px-6 shrink-0">

      <button
        className="p-2 lg:hidden text-slate-600 hover:bg-slate-50 rounded-md"
        onClick={onMenuClick}
      >☰</button>

      <div className="flex items-center gap-4 lg:gap-5 text-slate-500">
        <button className="relative hover:text-slate-800 cursor-pointer">
          <FontAwesomeIcon icon={faBell} className="text-lg text-slate-500" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] text-white
            font-bold px-1 rounded-full"></span>
        </button>

        <Link
          to="/mypage"
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg
            hover:bg-slate-50 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center
            font-bold text-sm text-slate-600 overflow-hidden shrink-0
            group-hover:ring-2 group-hover:ring-[#DDE8FF]">
            <img
              src={`http://localhost/file/profile/view?sysname=${user?.sysname}&token=${token}`}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 group-hover:text-[#3530B8]">{user?.name}</span>
            <p className="text-[10px] text-slate-400 -mt-0.5">{user?.dept_name}</p>
          </div>
        </Link>
      </div>
    </header>
  );
};
export default Header;