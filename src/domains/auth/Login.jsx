import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { userId, password });
    // TODO: Implement login logic
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      {/* Main Card Container */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Area A: Logo & Illustration Area (Top on mobile, Left on desktop) */}
        <div className="w-full md:w-1/2 bg-blue-50 p-8 flex flex-col items-center justify-center space-y-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              {/* Simple Eye Icon SVG */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="white" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-6 h-6"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold text-blue-900 tracking-tight">Orbit</span>
          </div>

          {/* Illustration Placeholder */}
          <div className="w-full h-48 md:h-64 bg-white/60 rounded-2xl relative overflow-hidden border-2 border-dashed border-blue-200 flex items-center justify-center">
            {/* Diagonal Lines (X) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className="w-full h-px bg-blue-600 rotate-45 absolute"></div>
              <div className="w-full h-px bg-blue-600 -rotate-45 absolute"></div>
            </div>
            <div className="text-blue-300 font-medium">Illustration Placeholder</div>
          </div>
        </div>

        {/* Area B: Login Form Area (Bottom on mobile, Right on desktop) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Login</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 ml-1">ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="아이디를 입력하세요"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2 relative">
              <label className="text-sm font-semibold text-gray-600 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-300"
                required
              />
              <div className="flex justify-end mt-1">
                <Link 
                  to="/find-account" 
                  className="text-xs text-blue-500 hover:underline transition-all"
                >
                  아이디 / 비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-4"
            >
              Login
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-8 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link 
              to="/signup" 
              className="text-blue-600 font-bold hover:underline"
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
