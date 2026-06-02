import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../../images/images';

const FindId = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", verificationCode: "" });
  const [showVerification, setShowVerification] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendCode = () => {
    // API 호출 로직 들어갈 자리
    setShowVerification(true);
    alert("인증번호가 전송되었습니다.");
  };

  const handleVerify = () => {
    // 인증번호 검증 로직 들어갈 자리
    alert("인증되었습니다.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Main Card Container */}
      <div className="w-[90%] h-[90vh] md:w-[60%] md:h-[60vh] bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image Area */}
        <div className="w-full h-1/3 md:h-full md:w-1/2 bg-gradient-to-br from-[#DDE8FF] via-[#F0F4FF] to-[#FFFFFF] p-4 md:p-8 flex flex-col items-center justify-center">
            <div className="w-full h-full bg-white/60 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#DDE8FF]">
                <img src={IMAGES.FIND_ACCOUNT} alt="Orbit Logo" className="max-h-24 md:max-h-32" />
            </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full h-2/3 md:h-full md:w-1/2 p-4 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-15">Forgot your ID?</h2>

          <div className="space-y-4">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">성함</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="성함을 입력하세요"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
                />
                <button
                  onClick={handleSendCode}
                  className="px-4 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]"
                >
                  인증번호 전송
                </button>
              </div>
            </div>

            {/* Conditional Verification Inputs */}
            {showVerification && (
              <div className="space-y-1 pt-2 animate-fadeIn">
                <label className="text-xs font-bold text-gray-600 ml-1">인증번호</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="verificationCode"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    placeholder="인증번호 6자리"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]"
                  />
                  <button
                    onClick={handleVerify}
                    className="px-9 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]"
                  >
                    인증
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="mt-8 w-full border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all"
          >
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default FindId;