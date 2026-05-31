import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import { updateUserInfo } from '../../api/userApi';

const MyPageEdit = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const postcodeRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    phone: user?.phone || '',
    zonecode: user?.zonecode || '',
    address1: user?.address1 || '',
    address2: user?.address2 || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        phone: user.phone || '',
        zonecode: user.zonecode || '',
        address1: user.address1 || '',
        address2: user.address2 || '',
      });
    }
  }, [user]);

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
  };

  const handleSearch = () => {
    setIsPostcodeOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await updateUserInfo(formData);
      setUser({ ...user, ...formData });
      alert('회원 정보가 수정되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      alert('정보 수정에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      phone: user?.phone || '',
      zonecode: user?.zonecode || '',
      address1: user?.address1 || '',
      address2: user?.address2 || '',
    });
    setIsEditing(false);
  };

  const infoRowStyle = {
    display: 'grid',
    gridTemplateColumns: '8rem 1fr',
    alignItems: 'center',
    height: '3.5rem',
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
    <div style={{ width: '100%', height: '100%', padding: '1.5rem 1.75rem', boxSizing: 'border-box', background: '#F8FAFC', overflowY: 'auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem' }}>내 정보 관리</h1>
          <p style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: '500' }}>나의 인사 정보와 연락처를 확인하고 관리할 수 있습니다.</p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* 기본 인사 정보 (수정 불가) */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#3530B8' }}>●</span> 기본 인사 정보
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' }}>
            <div style={infoRowStyle}><span style={labelStyle}>이름</span><span style={valueStyle}>{user?.name}</span></div>
            <div style={infoRowStyle}><span style={labelStyle}>아이디</span><span style={valueStyle}>{user?.id}</span></div>
            <div style={infoRowStyle}><span style={labelStyle}>사번</span><span style={valueStyle}>{user?.empNo}</span></div>
            <div style={infoRowStyle}><span style={labelStyle}>부서</span><span style={valueStyle}>{user?.department}</span></div>
            <div style={infoRowStyle}><span style={labelStyle}>직급</span><span style={valueStyle}>{user?.position}</span></div>
            <div style={infoRowStyle}><span style={labelStyle}>입사일</span><span style={valueStyle}>{user?.joinDate}</span></div>
          </div>
        </div>

        {/* 연락처 정보 (View/Edit 모드 전환) */}
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#3530B8' }}>●</span> 연락처 및 개인 정보
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={infoRowStyle}>
              <label style={labelStyle}>이메일</label>
              {isEditing ? (
                <input type="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} />
              ) : (
                <span style={valueStyle}>{user?.email || '-'}</span>
              )}
            </div>
            <div style={infoRowStyle}>
              <label style={labelStyle}>휴대전화</label>
              {isEditing ? (
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} />
              ) : (
                <span style={valueStyle}>{user?.phone || '-'}</span>
              )}
            </div>

            {/* 우편번호 */}
            <div style={infoRowStyle}>
              <label style={labelStyle}>우편번호</label>
              {isEditing ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" name="zonecode" value={formData.zonecode} readOnly style={{ ...inputStyle, width: '120px', background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                  <button type="button" onClick={handleSearch} style={{ padding: '0 1rem', background: '#3530B8', color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>검색</button>
                </div>
              ) : (
                <span style={valueStyle}>{user?.zonecode || '-'}</span>
              )}
            </div>

            {/* 기본주소 */}
            <div style={infoRowStyle}>
              <label style={labelStyle}>기본주소</label>
              {isEditing ? (
                <input type="text" name="address1" value={formData.address1} readOnly style={{ ...inputStyle, background: '#F8FAFC', border: '1px solid #E2E8F0' }} />
              ) : (
                <span style={valueStyle}>{user?.address1 || '-'}</span>
              )}
            </div>

            {/* 상세주소 */}
            <div style={infoRowStyle}>
              <label style={labelStyle}>상세주소</label>
              {isEditing ? (
                <input type="text" name="address2" value={formData.address2} onChange={handleChange} style={inputStyle} />
              ) : (
                <span style={valueStyle}>{user?.address2 || '-'}</span>
              )}
            </div>
          </div>
            
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #F1F5F9' }}>
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{ width: '120px', padding: '0.75rem', background: '#F1F5F9', border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{ width: '120px', padding: '0.75rem', background: '#3530B8', border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '700', color: 'white', cursor: 'pointer' }}
                >
                  저장하기
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/mypage')}
                  style={{ width: '120px', padding: '0.75rem', background: '#F1F5F9', border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '700', color: '#64748B', cursor: 'pointer' }}
                >
                  뒤로가기
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{ width: '120px', padding: '0.75rem', background: '#3530B8', border: 'none', borderRadius: '0.75rem', fontSize: '0.9rem', fontWeight: '700', color: 'white', cursor: 'pointer' }}
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

