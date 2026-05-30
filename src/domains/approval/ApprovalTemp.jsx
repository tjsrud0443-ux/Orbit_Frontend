import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';

const TEMP_DOCUMENTS = [
  { id: 1, title: '2024년 상반기 마케팅 기획서', type: '일반 품의서', updated_at: '2024-05-28', days_left: 6 },
  { id: 2, title: '5월 소모품 구매 요청', type: '구매 신청서', updated_at: '2024-05-27', days_left: 1 },
  { id: 3, title: '팀 빌딩 식대 지출', type: '지출 결의서', updated_at: '2024-05-26', days_left: 4 },
  { id: 4, title: '연차 신청', type: '휴가 신청서', updated_at: '2024-05-25', days_left: 2 },
  { id: 5, title: '신규 프로젝트 제안서', type: '일반 품의서', updated_at: '2024-05-24', days_left: 7 },
  { id: 6, title: '워크숍 장소 대여', type: '지출 결의서', updated_at: '2024-05-23', days_left: 3 },
];

const ApprovalTemp = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체 문서');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDocs = TEMP_DOCUMENTS.filter(doc => {
    const matchesType = selectedType === '전체 문서' || doc.type === selectedType;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const count = Math.ceil(filteredDocs.length / itemsPerPage);
  const displayDocs = filteredDocs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleEdit = (id) => {
    // console.log('수정하기', id);
  };

  const handleDelete = (id) => {
    // console.log('삭제하기', id);
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto p-5 lg:p-6">
      <div className="max-w-[1440px] mx-auto space-y-10">
        
        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">임시 문서함</h1>
            <p className="text-xs text-slate-500 font-medium">
              기안 작성 중 임시 저장된 문서를 확인하세요. (최대 저장 기간은 7일입니다.)
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto focus-within:ring-2 focus-within:ring-[#3530B8]/20 focus-within:border-[#3530B8] transition-all">
            <select 
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none"
            >
              <option>전체 문서</option>
              <option>일반 품의서</option>
              <option>지출 결의서</option>
              <option>휴가 신청서</option>
              <option>구매 신청서</option>
            </select>
            <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
            <div className="relative flex-1 md:w-56">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input 
                type="text" 
                placeholder="문서 제목 검색..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border-none focus:ring-0 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
            <button className="bg-[#3530B8] hover:bg-[#2a2594] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
              검색
            </button>
          </div>
        </div>

        {/* Sections: 목록 테이블 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[0.8125rem] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 pl-8 pr-4 w-[20%]">제목</th>
                  <th className="py-4 px-4 w-[25%] text-center">문서 종류</th>
                  <th className="py-4 px-4 w-[20%] text-center">최종 수정일</th>
                  <th className="py-4 px-4 w-[18%] text-center">임시 저장 기간</th>
                  <th className="py-4 pl-4 pr-8 w-[17%] text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayDocs.length > 0 ? (
                  displayDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-5 pl-8 pr-4">
                        <span className="text-xs font-bold text-slate-700 group-hover:text-[#3530B8] transition-colors cursor-pointer">
                          {doc.title}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {doc.type}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-tighter">
                          {doc.updated_at}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className={`text-xs font-bold ${doc.days_left === 1 ? 'text-rose-500' : 'text-slate-600'}`}>
                          {doc.days_left}일 남음
                        </span>
                      </td>
                      <td className="py-5 pl-4 pr-8">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(doc.id)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                            title="작성하기"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-xs" />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.id)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                            title="삭제"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-300 italic text-sm">
                      임시 저장된 문서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {count > 0 && (
            <div className="py-6 border-t border-slate-50">
              <Pagination 
                count={count} 
                page={page} 
                onChange={(_, value) => setPage(value)} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalTemp;
