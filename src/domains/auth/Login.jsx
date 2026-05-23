import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Login_logo from '../../assets/Login_logo.png'
import useAuthStore from '../../store/authStore';
import { loginRequest } from './authApi';

const Login = () => {
  const navi = useNavigate();
  const [login, setLogin] = useState({ id: "", pw: "" });
  const [error, setError] = useState({ id: false, pw: false });
  const loginSuccess = useAuthStore(state => state.login);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLogin(prev => ({ ...prev, [name]: value }))

    if (value) {
      setError({ ...error, [name]: false });
    }
  }

  const handleLogin = () => {
    const newError = { id: !login.id.trim(), pw: !login.pw.trim() };
    setError(newError);

    if (newError.id || newError.pw) {
      return;
    }

    loginRequest(login).then(resp => {
      loginSuccess(resp.data)
      navi("/main");
    })
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Main Card Container */}
      <div className="w-[90%] h-[90vh] md:w-[60%] md:h-[60vh] bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">

        {/* Area A: Logo & Illustration Area (Top on mobile, Left on desktop) */}
        <div className="w-full h-1/2 md:h-full md:w-1/2 bg-gradient-to-br from-[#DDE8FF] via-[#F0F4FF] to-[#FFFFFF] p-4 md:p-8 flex flex-col items-center justify-center space-y-4 md:space-y-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-2">

            <span className="text-xl md:text-2xl font-extrabold text-[#3530B8] tracking-tight">Orbit</span>
          </div>

          {/* Illustration Placeholder */}
          <div className="w-full h-32 md:h-64 bg-white/60 rounded-2xl relative overflow-hidden border-2 border-dashed border-[#DDE8FF] flex items-center justify-center">
            {/* Diagonal Lines (X) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-full h-px bg-[#3530B8] rotate-45 absolute"></div>
              <div className="w-full h-px bg-[#3530B8] -rotate-45 absolute"></div>
            </div>
            <div className="text-[#3530B8] font-medium"><img src={Login_logo} className="max-h-full" /></div>
          </div>
        </div>

        {/* Area B: Login Form Area (Bottom on mobile, Right on desktop) */}
        <div className="w-full h-1/2 md:h-full md:w-1/2 p-4 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-4 md:mb-8">Login</h2>

          <div className="space-y-3 md:space-y-6">
            {/* ID Input */}
            <div className="space-y-1 md:space-y-2">
              <label className="text-xs md:text-sm font-semibold text-gray-600 ml-1">ID</label>
              <input
                type="text"
                name="id"
                value={login.id}
                onChange={handleChange}
                placeholder="아이디를 입력하세요"
                className={`w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8] focus:border-transparent transition-all placeholder:text-gray-300"
              ${error.id ? `border-red-400 bg-red-50` : `border-gray-200 focus:border-blue-400`}`}
              />
              {error.id && <p className="text-red-500 text-sm ml-1 mt-1">ID를 입력해 주세요.</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-1 md:space-y-2 relative">
              <label className="text-xs md:text-sm font-semibold text-gray-600 ml-1">Password</label>
              <input
                type="password"
                name="pw"
                value={login.pw}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full px-4 py-2 md:py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8] focus:border-transparent transition-all placeholder:text-gray-300"
                ${error.pw ? `border-red-400 bg-red-50` : `border-gray-200 focus:border-blue-400`}  `}
              />
              {error.pw && <p className="text-red-500 text-sm ml-1 mt-1">Password를 입력해 주세요.</p>}
              <div className="flex justify-end mt-1">
                <Link
                  to="/findAccount"
                  className="text-[10px] md:text-xs text-[#3530B8] hover:underline transition-all"
                >
                  아이디 / 비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              className="w-full bg-[#3530B8] hover:bg-[#28248a] text-white font-bold py-2.5 md:py-3.5 rounded-xl shadow-lg shadow-[#3530B8]/20 transition-all active:scale-[0.98] mt-2 md:mt-4"
            >
              Login
            </button>
          </div>

          {/* Signup Link */}
          <div className="mt-4 md:mt-8 text-center text-xs md:text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link
              to="/signup"
              className="text-[#3530B8] font-bold hover:underline"
            >
              회원가입
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;