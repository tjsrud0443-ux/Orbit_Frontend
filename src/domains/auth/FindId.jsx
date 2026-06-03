import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../../images/images';
import { sendMailForId, verifyForFindId } from './authApi';

const FindId = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", code: "" });
  const [errors, setErrors] = useState({});
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [foundId, setFoundId] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSendCode = async () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "성함을 입력하세요.";
    if (!formData.email) newErrors.email = "이메일을 입력하세요.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try{
      const response = await sendMailForId(formData);
      if (response.data.success) {
        alert(response.data.message);
        setIsEmailSent(true);
      }
    }catch (error){
      const msg = error.response?.data?.message || "인증번호 발송에 실패했습니다.";
      alert(msg);
    }
  };

  const handleVerify = async () => {
    if (!formData.code) {
      setErrors(prev => ({ ...prev, code: "인증번호를 입력하세요." }));
      return;
    }

    try{
      const response = await verifyForFindId(formData);
      if(response.data.success){
        alert("인증에 성공했습니다.")
        setIsVerified(true);
        setFoundId(response.data.userId);
      }
    }catch (error){
      const msg = error.response?.data?.message || "인증에 실패했습니다.";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Main Card Container */}
      <div className="w-[90%] h-[90vh] md:w-[60%] md:h-[60vh] bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image Area */}
        <div className="w-full h-1/3 md:h-full md:w-1/2 bg-gradient-to-br from-[#DDE8FF] via-[#F0F4FF] to-[#FFFFFF] p-4 md:p-8 flex flex-col items-center justify-center">
            <div className="w-45 h-45 md:w-90 md:h-90 bg-white/60 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#DDE8FF]">
                <img src={IMAGES.FIND_ACCOUNT} className="max-h-50 md:max-h-100 object-contain rounded-2xl" />
            </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full h-2/3 md:h-full md:w-1/2 p-4 md:p-12 flex flex-col justify-center">
          {!isVerified ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-4 md:mb-13">Forgot your ID?</h2>

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
                    className={`w-full px-4 py-2 rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`}
                  />
                  {errors.name && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.name}</p>}
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
                      placeholder="가입 시 등록한 이메일"
                      className={`w-full px-4 py-2 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`}
                    />
                    <button
                      onClick={handleSendCode}
                      className="px-2 md:px-4 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]"
                    >
                      인증번호 전송
                    </button>
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.email}</p>}
                </div>

                {/* Conditional Verification Inputs */}
                {isEmailSent && (
                  <div className="space-y-1 pt-2 animate-fadeIn">
                    <label className="text-xs font-bold text-gray-600 ml-1">인증번호</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="인증번호 6자리"
                        className={`w-full px-4 py-2 rounded-xl border ${errors.code ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`}
                      />
                      <button
                        onClick={handleVerify}
                        className="px-7 md:px-9 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]"
                      >
                        인증
                      </button>
                    </div>
                    {errors.code && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.code}</p>}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center animate-fadeIn">
              <h2 className="text-2xl md:text-2xl font-bold text-gray-800 text-center mb-8">Here's your ID!</h2>
              <div className="w-full px-4 py-4 bg-[#F0F4FF] rounded-xl border border-gray-200 text-center text-xl font-bold text-[#3530B8]">
                {foundId}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={() => navigate("/")}
              className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all"
            >
              로그인하러 가기
            </button>
            <button
              onClick={() => navigate("/findPw")}
              className="flex-1 border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all"
            >
              비밀번호 찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindId;