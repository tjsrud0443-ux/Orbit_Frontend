import React, { useEffect, useState } from 'react';
import useUserStore from '../../store/userStore';
import useAuthStore from '../../store/authStore';
import { getCompanyInfo } from '../admin/adminApi';
import { Printer, ArrowLeft } from 'lucide-react';

const EmploymentCertificate = ({ purpose, onBack }) => {
  const { user } = useUserStore();
  const { token } = useAuthStore();
  const [company, setCompany] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await getCompanyInfo();
        setCompany(res.data);
      } catch (err) {
        console.error("Failed to fetch company info", err);
      }
    };
    fetchCompany();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const formatSsn = (ssn) => {
    if (!ssn) return '-';
    const front = ssn.split('-')[0];
    if (front.length === 6) {
      const yy = front.substring(0, 2);
      const mm = front.substring(2, 4);
      const dd = front.substring(4, 6);
      const yyyy = (parseInt(yy, 10) > 30 ? '19' : '20') + yy;
      return `${yyyy}년 ${mm}월 ${dd}일`;
    }
    return front;
  };

  const formatHireDate = (dateStr) => {
    if (!dateStr) return '-';
    const firstPart = dateStr.split(' ')[0];
    const parts = firstPart.split(/[/-]/);
    if (parts.length === 3) {
      let yyyy = parts[0];
      if (yyyy.length === 2) yyyy = (parseInt(yyyy, 10) > 30 ? '19' : '20') + yyyy;
      const mm = String(parts[1]).padStart(2, '0');
      const dd = String(parts[2]).padStart(2, '0');
      return `${yyyy}년 ${mm}월 ${dd}일`;
    }
    return firstPart;
  };

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}년 ${mm}월 ${dd}일`;

  const companyNameFormatted = company?.companyName && company.companyName.length > 4
    ? company.companyName.substring(4)
    : (company?.companyName || '-');

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10 flex flex-col items-center">
      {/* Action Buttons - Hidden on Print */}
      <div className="w-full max-w-[210mm] px-4 sm:px-0 mb-4 flex justify-between items-center no-print mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg shadow hover:bg-gray-50 transition text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition text-sm sm:text-base"
        >
          <Printer size={18} />
          인쇄
        </button>
      </div>

      {/* A4 Paper */}
      <div className="w-full overflow-x-auto pb-4 px-4 sm:px-0">
        <div className="mx-auto" style={{ width: '210mm', minWidth: '210mm' }}>
          <div
            className="relative bg-white shadow-xl overflow-hidden print-page"
            style={{
              width: '210mm',
              height: '297mm',
              padding: '25mm 20mm',
              boxSizing: 'border-box',
            }}
          >
        {/* Watermark */}
        {company?.officialmarkSysname && (
          <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none watermark-container">
            <img
              src={`https://api.sukong.shop/file/profile/view?sysname=${company.officialmarkSysname}&token=${token}`}
              alt="watermark"
              className="w-[80%] h-[80%] object-contain"
              style={{ opacity: 0.6, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            />
          </div>
        )}

        {/* Content Container (z-index relative to watermark) */}
        <div className="relative z-10 h-full flex flex-col font-serif">

          <h1 className="text-4xl font-bold text-center tracking-[1em] mt-10 mb-20 text-black">재직증명서</h1>

          <table className="w-full border-collapse border-2 border-black mb-16 text-black">
            <tbody>
              <tr>
                <td className="border border-black bg-gray-50/50 font-bold p-3 w-[15%] text-center text-lg">소속</td>
                <td className="border border-black p-3 w-[35%] text-lg">{user?.dept_name || '-'}</td>
                <td className="border border-black bg-gray-50/50 font-bold p-3 w-[15%] text-center text-lg">직급</td>
                <td className="border border-black p-3 w-[35%] text-lg">{user?.rank_name || '-'}</td>
              </tr>
              <tr>
                <td className="border border-black bg-gray-50/50 font-bold p-3 text-center text-lg">성명</td>
                <td className="border border-black p-3 text-lg">{user?.name || '-'}</td>
                <td className="border border-black bg-gray-50/50 font-bold p-3 text-center text-lg">생년월일</td>
                <td className="border border-black p-3 text-lg">{formatSsn(user?.ssn_masked)}</td>
              </tr>
              <tr>
                <td className="border border-black bg-gray-50/50 font-bold p-3 text-center text-lg">주소</td>
                <td colSpan="3" className="border border-black p-3 text-lg">
                  {user?.address1 || '-'} {user?.address2 || ''}
                </td>
              </tr>
              <tr>
                <td className="border border-black bg-gray-50/50 font-bold p-3 text-center text-lg">재직기간</td>
                <td colSpan="3" className="border border-black p-3 text-lg">
                  {formatHireDate(user?.hire_date)} ~ {todayStr} 현재 재직 중
                </td>
              </tr>
              <tr>
                <td className="border border-black bg-gray-50/50 font-bold p-3 text-center text-lg">용도</td>
                <td colSpan="3" className="border border-black p-3 text-lg">{purpose || '-'}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-center text-2xl font-bold tracking-widest mt-10 mb-16 text-black">
            위와 같이 재직하고 있음을 증명합니다.
          </div>

          <div className="text-center text-xl mb-auto text-black">
            {todayStr}
          </div>

          {/* Footer Info */}
          <div className="text-center pb-10 relative flex flex-col items-center justify-center text-black mt-8">
            <div className="flex items-center justify-center relative mb-4">
              <span className="text-[40px] font-bold tracking-[0.3em]">
                {companyNameFormatted}
              </span>
              <div className="w-[110px] h-[110px] flex items-center justify-center absolute right-[-130px]">
                {company?.officialsealSysname ? (
                  <img
                    src={`https://api.sukong.shop/file/profile/view?sysname=${company.officialsealSysname}&token=${token}`}
                    style={{ width: "110px", height: "110px", objectFit: "contain", WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                    alt="직인"
                  />
                ) : (
                  <div className="w-[110px] h-[110px] rounded-full border-2 border-red-500/50 flex items-center justify-center text-red-500/50 text-sm">직인</div>
                )}
              </div>
            </div>
            <div className="text-lg font-medium opacity-90 leading-relaxed mt-2">
              {company?.companyAddress || '-'} <br />
              Tel: {company?.companyTel || '-'} &nbsp;&nbsp; Fax: {company?.companyFax || '-'}
            </div>
          </div>

          </div>
        </div>
      </div>
    </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page, .print-page * {
            visibility: visible;
          }
          .print-page {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 25mm 20mm !important;
            box-shadow: none !important;
            width: 210mm !important;
            height: 297mm !important;
            background: white !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
};

export default EmploymentCertificate;
