import React, { useState, useEffect, useRef } from 'react';
import { checkMyPageEmail, getProfileInfo, updateUserInfo } from '../mypage/mypageApi'; 
import { emailDuplCheck } from '../auth/authApi';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import { alertSuccess, alertError } from '../../utils/alert';

const MyPageEdit = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const postcodeRef = useRef(null); 
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false); 
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    zonecode: '',
    address1: '',
    address2: '',
  });
  const [isEmailChecked, setIsEmailChecked] = useState(true);
  const [errors, setErrors] = useState({});
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

useEffect(() => {
  getProfileInfo()
    .then(resp => {
      setProfileData(resp.data);
      setFormData({
        email: resp.data.email || '',
        phone: resp.data.phone || '',
        zonecode: resp.data.zonecode || '',
        address1: resp.data.address1 || '',
        address2: resp.data.address2 || '',
      });
      setIsEmailChecked(true);
    }).catch(err => console.log("내정보 불러오기 실패", err));
}, []);

  useEffect(() => {
    if (isPostcodeOpen && postcodeRef.current) {
      new window.kakao.Postcode({
        oncomplete: function (data) {
          setFormData((prev) => ({
            ...prev,
            zonecode: data.zonecode,
            address1: data.roadAddress,
          }));
          setIsPostcodeOpen(false);
        },
      }).embed(postcodeRef.current);
    }
  }, [isPostcodeOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: '' })); 

    if (name === 'email') {
      if (value === profileData?.email) {
        setIsEmailChecked(true);
      } else {
        setIsEmailChecked(false);
      }
      setErrors(prev => ({ ...prev, emailCheck: '' }));
    }
  };

  const handleEmailDuplCheck = () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }));
      return;
    }
    if (!emailRegex.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: '올바른 이메일 형식이 아닙니다.' }));
      return;
    }

    checkMyPageEmail(formData.email).then(resp => {
      if (resp.data === false) {
        setIsEmailChecked(true);
        setErrors(prev => ({ ...prev, emailCheck: '' }));
      } else {
        setIsEmailChecked(false);
        setErrors(prev => ({ ...prev, emailCheck: '이미 사용 중인 이메일입니다.' }));
      }
    }).catch(err => {
      console.error('Email duplication check failed:', err);
      alertError('오류 발생', '중복 확인 중 오류가 발생했습니다.');
    });
  };

  const handleSearch = () => {
    setIsPostcodeOpen(true);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setErrors({});
    const newErrors = {};

    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'example@email.com(또는 co.kr) 등 알맞은 형식으로 입력해주세요.';
    }
    if (!isEmailChecked) {
      newErrors.emailCheck = '이메일 중복 확인이 필요합니다.';
    }
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = '010-0000-0000 형식으로 입력해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      updateUserInfo(formData).then(()=>{
        setProfileData({ ...profileData, ...formData });
        setUser({ ...user, ...formData });
        alertSuccess('수정 완료', '회원 정보가 수정되었습니다.');
        setIsEditing(false);
      })

    } catch (error) {
      console.error('Update failed:', error);
      alertError('수정 실패', '정보 수정에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setFormData({
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      zonecode: profileData?.zonecode || '',
      address1: profileData?.address1 || '',
      address2: profileData?.address2 || '',
    });
    setIsEditing(false);
    setIsEmailChecked(true);
    setErrors({});
  };

  const infoRowStyle = {
    display: 'grid',
    gridTemplateColumns: '8rem 1fr',
    alignItems: 'center',
    minHeight: '3.5rem', 
    borderBottom: '1px solid #F1F5F9',
    boxSizing: 'border-box'
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    height: '100%'
  };

  const valueStyle = {
    fontSize: '0.9rem',
    color: '#1E293B',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    height: '2.5rem',
    padding: '0 0.8rem',
    border: '1px solid transparent',
    boxSizing: 'border-box'
  };

  const inputStyle = {
    width: '100%',
    height: '2.5rem',
    padding: '0 0.8rem',
    borderRadius: '0.5rem',
    border: '1px solid #3530B8',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#F0F4FF',
    display: 'flex',
    alignItems: 'center'
  };

  return (
    <div style={{ width: '100%', minHeight: '100%', padding: '1rem 1.5rem 2.5rem', boxSizing: 'border-box', background: 'white', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 2rem;
        }
            /* 스크롤바 스타일 추가 */
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 999px;
        }
        @media (max-width: 767px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }
        }
        @media (max-width: 480px) {
          .info-row {
            grid-template-columns: 1fr !important;
            height: auto !important;
            padding: 0.4rem 0 !important;
          }
          .info-label {
            height: auto !important;
            margin-bottom: 0.1rem;
            font-size: 0.75rem !important;
          }
          .info-value {
            height: auto !important;
            padding: 0 !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
      {/* 헤더 */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', shrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.15rem' }}>내 정보 관리</h1>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '500' }}>나의 인사 정보와 연락처를 확인하고 관리할 수 있습니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
        
        {/* 기본 인사 정보 (수정 불가) */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.25rem', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#3530B8' }}>●</span> 기본 인사 정보
          </h3>
          <div className="info-grid">
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row"><span style={labelStyle} className="info-label">이름</span><span style={valueStyle} className="info-value">{profileData?.name}</span></div>
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row"><span style={labelStyle} className="info-label">아이디</span><span style={valueStyle} className="info-value">{profileData?.id}</span></div>
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row"><span style={labelStyle} className="info-label">사번</span><span style={valueStyle} className="info-value">{profileData?.users_seq}</span></div>
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row"><span style={labelStyle} className="info-label">부서</span><span style={valueStyle} className="info-value">{profileData?.dept_name}</span></div>
            <div style={{...infoRowStyle, height: '2.8rem',border:'none'}} className="info-row"><span style={labelStyle} className="info-label">직급</span><span style={valueStyle} className="info-value">{profileData?.rank_name}</span></div>
            <div style={{...infoRowStyle, height: '2.8rem',border:'none'}} className="info-row"><span style={labelStyle} className="info-label">입사일</span><span style={valueStyle} className="info-value">{profileData?.hire_date?.split(' ')[0]}</span></div>
          </div>
        </div>

        {/* 연락처 정보 (View/Edit 모드 전환) */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.25rem', padding: '1.25rem', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#3530B8' }}>●</span> 연락처 및 개인 정보
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{...infoRowStyle, minHeight: '2.8rem'}} className="info-row">
              <label style={labelStyle} className="info-label">이메일</label>
              {isEditing ? (
                 <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '0.25rem', padding: '0.5rem 0' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      placeholder="example@email.com"
                      style={{...inputStyle, height: '2.2rem', flex: 1, border: (errors.email || errors.emailCheck) ? '1px solid #EF4444' : '1px solid #3530B8'}} 
                    />
                    <button 
                      type="button" 
                      onClick={handleEmailDuplCheck}
                      style={{ padding: '0 0.8rem', background: '#3530B8', color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      중복확인
                    </button>
                  </div>
                  {errors.email && <p style={{ color: '#EF4444', fontSize: '0.65rem', margin: '0 0 0 0.25rem', fontWeight: '500' }}>{errors.email}</p>}
                  {errors.emailCheck && <p style={{ color: '#EF4444', fontSize: '0.65rem', margin: '0 0 0 0.25rem', fontWeight: '500' }}>{errors.emailCheck}</p>}
                  {isEmailChecked && !errors.emailCheck && formData.email !== profileData?.email && (
                    <p style={{ color: '#10B981', fontSize: '0.65rem', margin: '0 0 0 0.25rem', fontWeight: '500' }}>사용 가능한 이메일입니다.</p>
                  )}
                </div>
              ) : (
                <span style={valueStyle} className="info-value">{profileData?.email || '-'}</span>
              )}
            </div>
            <div style={{...infoRowStyle, minHeight: '2.8rem'}} className="info-row">
              <label style={labelStyle} className="info-label">휴대전화</label>
              {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{...inputStyle, height: '2.2rem', border: errors.phone ? '1px solid #EF4444' : '1px solid #3530B8'}} />
                    {errors.phone && <span style={{ fontSize: '0.7rem', color: '#EF4444', marginTop: '2px' }}>{errors.phone}</span>}
                  </div>
              ) : (
                <span style={valueStyle} className="info-value">{profileData?.phone || '-'}</span>
              )}
            </div>

            {/* 우편번호 */}
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row">
              <label style={labelStyle} className="info-label">우편번호</label>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" name="zonecode" value={formData.zonecode} readOnly style={{ ...inputStyle, height: '2.2rem', width: '100px', background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  <button type="button" onClick={handleSearch} style={{ padding: '0 0.8rem', background: '#3530B8', color: 'white', border: 'none', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>검색</button>
                </div>
              ) : (
                <span style={valueStyle} className="info-value">{profileData?.zonecode || '-'}</span>
              )}
            </div>

            {/* 기본주소 */}
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row">
              <label style={labelStyle} className="info-label">기본주소</label>
              {isEditing ? (
                <input type="text" name="address1" value={formData.address1} readOnly style={{ ...inputStyle, height: '2.2rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
              ) : (
                <span style={valueStyle} className="info-value">{profileData?.address1 || '-'}</span>
              )}
            </div>

            {/* 상세주소 */}
            <div style={{...infoRowStyle, height: '2.8rem'}} className="info-row">
              <label style={labelStyle} className="info-label">상세주소</label>
              {isEditing ? (
                <input type="text" name="address2" value={formData.address2} onChange={handleChange} style={{...inputStyle, height: '2.2rem'}} />
              ) : (
                <span style={valueStyle} className="info-value">{profileData?.address2 || '-'}</span>
              )}
            </div>
          </div>
            
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem', paddingTop: '1rem',  }}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{ width: '100px', padding: '0.6rem', background: '#F1F5F9', border: 'none', borderRadius: '0.6rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{ width: '100px', padding: '0.6rem', background: '#3530B8', border: 'none', borderRadius: '0.6rem', fontSize: '0.85rem', fontWeight: '700', color: 'white', cursor: 'pointer' }}
                >
                  저장하기
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/mypage')}
                  style={{ width: '100px', padding: '0.6rem', background: '#F1F5F9', border: 'none', borderRadius: '0.6rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                >
                  뒤로가기
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{ width: '100px', padding: '0.6rem', background: '#3530B8', border: 'none', borderRadius: '0.6rem', fontSize: '0.85rem', fontWeight: '700', color: 'white', cursor: 'pointer' }}
                >
                  수정하기
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 우편번호 검색 모달 */}
      {isPostcodeOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'relative', bg: 'white', width: '100%', maxWidth: '500px', height: '500px', background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <button
              type="button"
              onClick={() => setIsPostcodeOpen(false)}
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', zIndex: 1010, width: '2rem', height: '2rem', borderRadius: '50%', background: 'white', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}
            >
              ✕
            </button>
            <div ref={postcodeRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPageEdit;

