import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Signup_pic from '../../assets/Signup_pic.png';
import { duplCheck } from './authApi';

const Signup = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const postcodeRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id: '',
    pw: '',
    confirmPw: '',
    ssn: '',
    zonecode: '',
    address1: '',
    address2: '',
    email: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'id') {
      setIsIdChecked(false);
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        setErrors((prev) => ({ ...prev, profileImage: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDuplCheck = () => {
    duplCheck(formData.id).then(resp => {
      if (!formData.id) {
        setErrors(prev => ({...prev, id: '아이디를 입력해주세요.'}));
        return;
      }
      if(resp.data === true){
        setErrors(prev => ({...prev, id: '이미 사용 중인 아이디입니다.'}));
        setIsIdChecked(false);
      }else{
        setIsIdChecked(true);
        setErrors((prev) => ({...prev, idCheck: ''}));
      }
    })
  };

  useEffect(() => {
    if (isPostcodeOpen) {
      new window.kakao.Postcode({
        oncomplete: function (data) {
          setFormData((prev) => ({
            ...prev,
            zonecode: data.zonecode,
            address1: data.roadAddress,
          }));
          
          setErrors((prev) => ({
            ...prev,
            zonecode: '',
            address1: '',
          }));

          setIsPostcodeOpen(false);
        },
      }).embed(postcodeRef.current);
    }
  }, [isPostcodeOpen]);

  const handleSearch = () => {
    setIsPostcodeOpen(true);
  };

  const handleBack = () => {
    navigate("/");
  };

  const validateSsn = (ssn) => {
    const yy = ssn.substring(0, 2);
    const mm = ssn.substring(2, 4);
    const dd = ssn.substring(4, 6);

    const genderCode = ssn[7];

    let fullYear = '';

    if (genderCode === '1' || genderCode === '2') {
      fullYear = '19' + yy;
    } else if (genderCode === '3' || genderCode === '4') {
      fullYear = '20' + yy;
    } else {
      return false;
    }

    const birthDate = new Date(`${fullYear}-${mm}-${dd}`);

    return (
      birthDate.getFullYear() === Number(fullYear) &&
      birthDate.getMonth() + 1 === Number(mm) &&
      birthDate.getDate() === Number(dd)
    );
  };

  const phoneRegex = /^010-\d{4}-\d{4}$/;
  const idRegex = /^[A-Za-z\d_]{5,20}$/;
  const pwRegex = /^[A-Za-z\d!@#$%^&*]{8,20}$/;
  const ssnRegex = /^\d{6}-\d{7}$/;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[a-z]+\.[a-z]+\.*[a-z]*$/;

  const handleSubmit = () => {
    const newErrors = {};
    if (!profileImage) newErrors.profileImage = '프로필 사진을 선택해주세요.';
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    }
    if (!formData.phone) {
      newErrors.phone = '전화번호를 입력해주세요.';
    }else if(!phoneRegex.test(formData.phone)){
      newErrors.phone = '010-0000-0000 형식으로 입력해주세요.';
    }
    if (!formData.id) {
      newErrors.id = '아이디를 입력해주세요.';
    }else if(!idRegex.test(formData.id)){
      newErrors.id = '영문 대/소문자와 _로 5~20자 입력 가능합니다.';
    }else if(!isIdChecked){
      newErrors.idCheck = '아이디 중복확인을 해주세요.';
    }
    if (!formData.pw) {
      newErrors.pw = '비밀번호를 입력해주세요.';
    }else if(!pwRegex.test(formData.pw)){
      newErrors.pw = '영문 대/소문자와 특수문자(!@#$%^&*)로 8~20자 입력 가능합니다.';
    }
    if (!formData.confirmPw) {
      newErrors.confirmPw = '비밀번호를 한 번 더 입력해주세요.';
    }else if(formData.pw !== formData.confirmPw){
      newErrors.confirmPw = '비밀번호가 일치하지 않습니다.';
    }
    if (!formData.ssn) {
      newErrors.ssn = '주민등록번호를 입력해주세요.';
    }else if(!ssnRegex.test(formData.ssn)){
      newErrors.ssn = '앞자리(6자)-뒷자리(7자) 모두 입력해주세요.';
    }else if(!validateSsn(formData.ssn)){
      newErrors.ssn = '존재하지 않는 날짜입니다.';
    }
    if (!formData.zonecode) newErrors.zonecode = '찾기 버튼을 눌러 주소를 입력해주세요.';
    if (!formData.address1) newErrors.address1 = '찾기 버튼을 눌러 주소를 입력해주세요.';
    if (!formData.address2) newErrors.address2 = '상세주소를 입력해주세요.';
    if (!formData.email) {
      newErrors.email = '이메일 주소를 입력해주세요.';
    }else if(!emailRegex.test(formData.email)){
      newErrors.email = 'example@email.com(또는 co.kr) 등 알맞은 형식으로 입력해주세요.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex items-center justify-center p-4 md:p-8">
      <div className="w-[90%] max-w-[1400px] min-h-[85vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row relative border border-[#F0F4FF]">
        
        {/* Mobile Top Navigation */}
        <div className="md:hidden flex items-center p-6 bg-white z-10">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-[#3530B8]"
            aria-label="뒤로가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="ml-2 font-bold text-[#3530B8]">회원가입</span>
        </div>

        {/* Left Side: Minimal Title Section (PC Only) */}
        <div className="hidden md:flex md:w-[40%] bg-[#F0F4FF] items-center justify-center p-16 relative overflow-hidden">
          <div className="z-10 w-full max-w-sm">
            <div className="mb-12">
              <div className="w-16 h-2 bg-[#3530B8] rounded-full mb-6"></div>
              <h1 className="text-5xl font-extrabold text-[#3530B8] leading-tight tracking-tight">
                Join <br /> 
                <span className="text-gray-900">Orbit Workspace</span>
              </h1>
              <p className="mt-6 text-gray-700 text-lg font-bold leading-relaxed">
                가장 효율적인 협업의 시작, <br />
                Orbit 워크스페이스와 함께 하세요.
              </p>
            </div>
            
            <div className="relative w-full flex items-center justify-center group transition-all duration-500">
              <img src={Signup_pic} className="w-full h-auto transform transition-transform" alt="Signup Visual" />
            </div>
          </div>
        </div>

        <div className="w-full md:w-[60%] flex flex-col h-full bg-white overflow-y-auto custom-scrollbar">
          <div className="p-5 pb-32 md:p-12 lg:p-16 max-w-xl mx-auto w-full">
            
            <div className="space-y-5 md:space-y-8">
              {/* Profile Section */}
              <div className="flex flex-col items-center space-y-3 mb-6 md:mb-10">
                <div className="relative">
                  <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full border ${errors.profileImage ? 'border-red-500' : 'border-gray-100'} bg-[#F0F4FF] flex items-center justify-center overflow-hidden shadow-sm`}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-[#3530B8] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#363091] transition-all border-2 md:border-4 border-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs md:text-sm font-medium text-gray-400">프로필 이미지 등록</p>
                {errors.profileImage && <p className="text-red-500 text-xs font-medium">{errors.profileImage}</p>}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">이름</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="이름을 입력하세요"
                    className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">전화번호</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010-0000-0000"
                    className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">아이디</label>
                  <div className="flex gap-2 md:gap-3">
                    <input
                      type="text"
                      name="id"
                      value={formData.id}
                      onChange={handleChange}
                      placeholder="아이디"
                      className={`flex-1 px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.id ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                    />
                    <button
                      type="button"
                      onClick={handleDuplCheck}
                      className="px-4 md:px-6 py-3 md:py-4 bg-[#F0F4FF] text-[#3530B8] rounded-xl md:rounded-2xl text-sm font-bold hover:bg-[#DDE8FF] transition-all whitespace-nowrap"
                    >
                      중복확인
                    </button>
                  </div>
                  {errors.id && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.id}</p>}
                  {errors.idCheck && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.idCheck}</p>}
                  {isIdChecked && !errors.idCheck && <p className="text-green-500 text-xs mt-1 ml-1 font-medium">사용 가능한 아이디입니다.</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">비밀번호</label>
                    <input
                      type="password"
                      name="pw"
                      value={formData.pw}
                      onChange={handleChange}
                      placeholder="비밀번호"
                      className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.pw ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                    />
                    {errors.pw && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.pw}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">비밀번호 확인</label>
                    <input
                      type="password"
                      name="confirmPw"
                      value={formData.confirmPw}
                      onChange={handleChange}
                      placeholder="비밀번호 확인"
                      className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.confirmPw ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                    />
                    {errors.confirmPw && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.confirmPw}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">주민등록번호</label>
                  <input
                    type="tel"
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleChange}
                    placeholder="000000-0000000"
                    className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.ssn ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                  />
                  {errors.ssn && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.ssn}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">우편번호</label>
                  <div className="flex gap-2 md:gap-3">
                    <input
                      type="text"
                      name="zonecode"
                      value={formData.zonecode}
                      onChange={handleChange}
                      placeholder="우편번호"
                      className={`flex-1 px-4 md:px-5 py-3 md:py-4 bg-[#F5F8FF] border ${errors.zonecode ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl outline-none text-gray-500 shadow-inner`}
                      readOnly
                    />
                    <button
                      type="button"
                      className="px-4 md:px-6 py-3 md:py-4 bg-[#F0F4FF] text-[#3530B8] rounded-xl md:rounded-2xl text-sm font-bold hover:bg-[#DDE8FF] transition-all"
                      onClick={handleSearch}
                    >
                      찾기
                    </button>
                  </div>
                  {errors.zonecode && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.zonecode}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">기본주소</label>
                  <input
                    type="text"
                    name="address1"
                    value={formData.address1}
                    onChange={handleChange}
                    placeholder="주소찾기를 이용해주세요"
                    className={`w-full px-4 md:px-5 py-3 md:py-4 bg-[#F5F8FF] border ${errors.address1 ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl outline-none text-gray-500 shadow-inner`}
                    readOnly
                  />
                  {errors.address1 && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.address1}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">상세주소</label>
                  <input
                    type="text"
                    name="address2"
                    value={formData.address2}
                    onChange={handleChange}
                    placeholder="상세주소를 입력하세요"
                    className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.address2 ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                  />
                  {errors.address2 && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.address2}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 md:mb-2 ml-1">이메일 주소</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className={`w-full px-4 md:px-5 py-3 md:py-4 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-xl md:rounded-2xl focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-gray-700 shadow-sm`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email}</p>}
                </div>
              </div>

              {/* PC Action Buttons */}
              <div className="hidden md:flex gap-4 pt-12 pb-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-6 py-5 border border-gray-200 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 hover:text-gray-600 transition-all"
                >
                  뒤로가기
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-[2] px-6 py-5 bg-[#3530B8] text-white rounded-2xl font-bold hover:bg-[#363091] shadow-xl shadow-[#3530B8]/20 transition-all transform hover:-translate-y-1 active:scale-[0.98]"
                >
                  회원가입
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Action Button */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-gray-100">
          <button
            onClick={handleSubmit}
            className="w-full px-6 py-5 bg-[#3530B8] text-white rounded-2xl font-bold text-lg hover:bg-[#363091] shadow-xl shadow-[#3530B8]/20 active:scale-[0.98] transition-all"
          >
            회원가입
          </button>
        </div>
      </div>
      
      {/* 우편번호 검색 모달 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          
          <div className="relative bg-white w-full max-w-[500px] h-[500px] rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            
            {/* 닫기 버튼 */}
            <button
              type="button"
              onClick={() => setIsPostcodeOpen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-500 hover:bg-gray-50"
            >
              ✕
            </button>

            {/* 카카오 주소검색 들어가는 div */}
            <div
              ref={postcodeRef}
              className="w-full h-full"
            ></div>

          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
      `}} />
    </div>
  );
};

export default Signup;
