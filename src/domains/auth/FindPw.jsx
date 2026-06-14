import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMAGES } from '../../images/images';
import { sendMailForPw, sendNewPw, verifyForFindPw } from './authApi';
import useLoadingStore from '../../store/useLoadingStore';
import { alertWarning, alertSuccess, alertError, alertConfirm } from '../../utils/alert';

const FindPw = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", id: "", email: "", code: "", newPw: "", confirmPw: "", token: ""});
  const [errors, setErrors] = useState({});
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const showLoading = useLoadingStore(state => state.showLoading);
  const hideLoading = useLoadingStore(state => state.hideLoading);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const passwordRegex = /^[a-zA-Z\d!@#$%^&*]{8,20}$/;

  const getPasswordPlaceholder = () => {
    return windowWidth < 768 
      ? "비밀번호 입력" 
      : "영문 대/소문자와 숫자, 특수문자(!@#$%^&*)로 8~20자";
  };

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
    if (!formData.id) newErrors.id = "아이디를 입력하세요.";
    if (!formData.email) newErrors.email = "이메일을 입력하세요.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try{
      showLoading();
      const response = await sendMailForPw(formData);
      if (response.data.success) {
        hideLoading();
        await alertSuccess('전송 완료', response.data.message);
        setIsEmailSent(true);
      }
    }catch (error){
      const msg = error.response?.data?.message || "인증번호 발송에 실패했습니다.";
      hideLoading();
      await alertError('전송 실패', msg);
    }finally {
      hideLoading();
    }
  };

  const handleVerify = async () => {
    if (!formData.code) {
      setErrors(prev => ({ ...prev, code: "인증번호를 입력하세요." }));
      return;
    }

    try{
      const response = await verifyForFindPw(formData);
      if(response.data.success){
        await alertSuccess('인증 완료', '인증이 완료되었습니다.');
        setIsVerified(true);
        setFormData(prev => ({...prev, token: response.data.resetToken}));
      }
    }catch (error){
      const msg = error.response?.data?.message || "인증에 실패했습니다.";
      await alertError('인증 실패', msg);
    }
  };

  const handleNewPw = async () => {
    const newErrors = {};
    if (!formData.newPw) {
      newErrors.newPw = "새 비밀번호를 입력하세요.";
    } else if (!passwordRegex.test(formData.newPw)) {
      newErrors.newPw = "영문 대/소문자와 숫자, 특수문자(!@#$%^&*)로 8~20자 입력 가능합니다.";
    }

    if (!formData.confirmPw) {
      newErrors.confirmPw = "비밀번호 확인을 입력하세요.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }

    try{
      const response = await sendNewPw(formData);
      if(response.data.success){
        await alertSuccess('변경 완료', response.data.message);
        navigate("/");
      }
    }catch (error){
      const msg = error.response?.data?.message || "비밀번호 변경을 실패했습니다.";
      await alertError('변경 실패', msg);
    }
  }

  const passwordMatch = formData.newPw === formData.confirmPw && formData.newPw !== "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-[90%] h-[90vh] md:w-[60%] md:h-[75vh] bg-white rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Image Area */}
        <div className="w-full h-1/4 md:h-full md:w-1/2 bg-gradient-to-br from-[#DDE8FF] via-[#F0F4FF] to-[#FFFFFF] p-4 md:p-8 flex flex-col items-center justify-center shrink-0">
          <div className="w-32 h-32 md:w-90 md:h-90 bg-white/60 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#DDE8FF]">
            <img src={IMAGES.FIND_ACCOUNT} className="max-h-30 md:max-h-100 object-contain rounded-2xl" />
          </div>
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full flex-grow p-4 md:p-8 flex flex-col justify-start overflow-y-auto custom-scrollbar">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-4 md:mb-8 shrink-0">Forgot your password?</h2>

          <div className="space-y-4 shrink-0">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">성함</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="성함을 입력하세요" className={`w-full px-4 py-2 text-sm rounded-xl border ${errors.name ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`} />
              {errors.name && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">아이디</label>
              <input type="text" name="id" value={formData.id} onChange={handleChange} placeholder="아이디를 입력하세요" className={`w-full px-4 py-2 text-sm rounded-xl border ${errors.id ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`} />
              {errors.id && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.id}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 ml-1">이메일</label>
              <div className="flex gap-2">
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="가입 시 등록한 이메일" className={`w-full px-4 py-2 text-sm rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`} />
                <button onClick={handleSendCode} className="px-2 md:px-4 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]">인증번호 전송</button>
              </div>
              {errors.email && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.email}</p>}
            </div>

            {isEmailSent && (
              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-gray-600 ml-1">인증번호</label>
                <div className="flex gap-2">
                  <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="인증번호 6자리" className={`w-full px-4 py-2 text-sm rounded-xl border ${errors.code ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`} />
                  <button onClick={handleVerify} className="px-7 md:px-9 py-2 bg-[#3530B8] text-white text-xs font-bold rounded-xl whitespace-nowrap hover:bg-[#28248a]">인증</button>
                </div>
                {errors.code && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.code}</p>}
              </div>
            )}

            {isVerified && (
              <div className="space-y-3 pt-4 border-t border-gray-100 animate-fadeIn">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 ml-1">새 비밀번호</label>
                  <input type="password" name="newPw" value={formData.newPw} onChange={handleChange} placeholder={getPasswordPlaceholder()} className={`w-full px-4 py-2 text-sm rounded-xl border ${errors.newPw ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`} />
                  {errors.newPw && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.newPw}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 ml-1">비밀번호 확인</label>
                  <input type="password" name="confirmPw" value={formData.confirmPw} onChange={handleChange} placeholder="비밀번호 확인" className={`w-full px-4 py-2 text-sm rounded-xl border ${errors.confirmPw ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[#3530B8]`} />
                  {errors.confirmPw && <p className="text-red-500 text-[10px] ml-1 mt-1 font-bold">{errors.confirmPw}</p>}
                  {formData.confirmPw !== "" && !errors.confirmPw && (
                    <p className={`text-[10px] ml-1 mt-1 font-bold ${passwordMatch ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordMatch ? "비밀번호가 일치합니다." : "비밀번호가 일치하지 않습니다."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-8 shrink-0">
            <button 
              onClick={() => navigate("/")} 
              className={`border border-gray-200 text-gray-600 font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-all ${isVerified ? 'flex-1' : 'w-full'}`}
            >
              로그인하러 가기
            </button>
            {isVerified && (
              <button 
                onClick={handleNewPw}
                className="flex-1 bg-[#3530B8] text-white font-bold py-2.5 rounded-xl hover:bg-[#28248a] transition-all"
              >
                변경완료
              </button>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default FindPw;