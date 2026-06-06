import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { deleteDoc, getTempDoc } from './approvalApi';


const ApprovalTemp = () => {
  const navi = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체 문서');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    getTempDoc().then(resp => {
      setDocuments(resp.data);
    })
  }, []);

  const expiresDay = (day) => {
    const today = new Date();
    const expire = new Date(day);

    today.setHours(0, 0, 0, 0);
    expire.setHours(0, 0, 0, 0);

    const result = Math.floor((expire - today) / (1000 * 60 * 60 * 24));
    return Math.max(result, 0);
  }

  const filteredDocs = documents.filter(doc => {
    const matchesType = selectedType === '전체 문서' || doc.doc_type === selectedType;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const count = Math.ceil(filteredDocs.length / itemsPerPage);
  const displayDocs = filteredDocs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleEdit = (doc) => {
    navi(`/approval/detail/${doc.doc_type}/${doc.doc_seq}`);
  };

  const handleDelete = (doc) => {
    if(!window.confirm("정말 삭제하시겠습니까? 삭제 후에는 복구가 불가합니다. ")) {
      return;
    }
    deleteDoc(doc.doc_seq, doc.doc_type).then(resp => {
      alert("삭제가 완료되었습니다.");
      getTempDoc().then(resp => {
        setDocuments(resp.data);
        
        const newCount = Math.ceil(resp.data.length / itemsPerPage);
        if (page > newCount && newCount > 0) {
          setPage(newCount);
        }
      })
    })
  };

  const docType = {
    'GENERAL': '일반품의서',
    'PAYMENT': '지출결의서',
    'VACATION': '휴가신청서',
    'PURCHASE': '구매신청서'
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto p-5 lg:p-6">
      <div className="max-w-[1440px] mx-auto space-y-10">

        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">임시 문서함</h1>
            <p className="text-xs text-slate-500 font-medium break-keep">
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
              className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none whitespace-nowrap"
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
          </div>
        </div>

        {/* Sections: 목록 테이블 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[0.8125rem] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
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
                    <tr key={doc.seq} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-5 pl-8 pr-4">
                        <span className="text-sm font-bold text-slate-700 transition-colors whitespace-nowrap">
                          {doc.title}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                          {docType[doc.doc_type] || doc.doc_type}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className="text-xs font-bold text-slate-400 font-mono tracking-tighter whitespace-nowrap">
                          {doc.updated_at?.substring(0, 10)}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-center">
                        <span className={`text-xs font-bold whitespace-nowrap ${expiresDay(doc.temp_expires_at) <= 1 ? 'text-rose-500' : 'text-slate-600'}`}>
                          {expiresDay(doc.temp_expires_at)}일 남음
                        </span>
                      </td>
                      <td className="py-5 pl-4 pr-8">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                            title="작성하기"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
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
                    <td colSpan="5" className="py-20 text-center text-slate-400 text-sm font-bold whitespace-nowrap">
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
