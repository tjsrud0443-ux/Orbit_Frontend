import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../../images/images';

const FindPw = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", id: "", email: "", verificationCode: "", newPw: "", confirmPw: "" });
  const [showVerification, setShowVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendCode = () => {
    setShowVerification(true);
    alert("인증번호가 전송되었습니다.");
  };

  const handleVerify = () => {
    setIsVerified(true);
    alert("인증되었습니다.");
  };

  const passwordMatch = formData.newPw === formData.confirmPw && formData.newPw !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-[90%] h-[90vh] md:w-[60%] md:h-[75vh] bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image Area */}
        <div className="w-full h-1/4 md:h-full md:w-1/2 bg-gradient-to-br from-[#DDE8FF] via-[#F0F4FF] to-[#FFFFFF] p-4 md:p-8 flex flex-col items-center justify-center">
          <div className="w-45 h-45 md:w-90 md:h-90 bg-white/60 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#DDE8FF]">
            <img src={IMAGES.FIND_ACCOUNT} className="max-h-50 md:max-h-100 object-contain rounded-2xl" />
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full h-3/4 md:h-full md:w-1/2 p-4 md:p-8 flex flex-col justify-center overflow-y-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-4 md:mb-8">Forgot your password?</h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">성함</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="성함을 입력하세요" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">아이디</label>
              <input type="text" name="id" value={formData.id} onChange={handleChange} placeholder="아이디를 입력하세요" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">이메일</label>
              <div className="flex gap-2">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="가입 시 등록한 이메일" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]" />
                <button onClick={handleSendCode} className="px-4 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]">인증번호 전송</button>
              </div>
            </div>

            {showVerification && (
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-gray-600 ml-1">인증번호</label>
                <div className="flex gap-2">
                  <input type="text" name="verificationCode" value={formData.verificationCode} onChange={handleChange} placeholder="인증번호 6자리" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]" />
                  <button onClick={handleVerify} className="px-9 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]">인증</button>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="space-y-3 pt-4 border-t border-gray-100 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 ml-1">새 비밀번호</label>
                  <input type="password" name="newPw" value={formData.newPw} onChange={handleChange} placeholder="새 비밀번호" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 ml-1">비밀번호 확인</label>
                  <input type="password" name="confirmPw" value={formData.confirmPw} onChange={handleChange} placeholder="비밀번호 확인" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3530B8]" />
                  {formData.confirmPw !== "" && (
                    <p className={`text-[10px] ml-1 mt-1 font-bold ${passwordMatch ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8">
            <button 
              onClick={() => navigate("/")} 
              className={`border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all ${isVerified ? 'flex-1' : 'w-full'}`}
            >
              로그인하러 가기
            </button>
            {isVerified && (
              <button 
                className="flex-1 bg-[#3530B8] text-white font-bold py-2.5 rounded-xl hover:bg-[#28248a] transition-all"
              >
                변경완료
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindPw;