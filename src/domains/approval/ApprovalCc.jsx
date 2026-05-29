import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import Pagination from '../../components/common/Pagination';
import { getCcDocuments } from './approvalApi';
import useAuthStore from '../../store/authStore';

// --- Dummy Data ---
// const CC_DOCUMENTS = [
//   { 
//     id: 201, 
//     title: '2024년 2분기 마케팅 예산 편성 안', 
//     type: '일반품의서', 
//     typeKey: 'general', 
//     drafter: '홍길동 과장', 
//     date: '2024-05-20', 
//     status: '결재 대기',
//     currentApprover: '김철수 부장',
//     approvalLine: [
//       { name: '김철수', rank: '부장' },
//       { name: '이영희', rank: '차장' },
//       { name: '박지민', rank: '팀장' }
//     ]
//   },
//   { 
//     id: 202, 
//     title: '신규 협력업체 계약 검토 요청', 
//     type: '일반품의서', 
//     typeKey: 'general', 
//     drafter: '이몽룡 대리', 
//     date: '2024-05-21', 
//     status: '진행 중',
//     currentApprover: '박상무 상무',
//     approvalLine: [
//       { name: '박상무', rank: '상무' },
//       { name: '최전무', rank: '전무' },
//       { name: '이대표', rank: '대표' },
//       { name: '정회장', rank: '회장' }
//     ]
//   },
//   { 
//     id: 203, 
//     title: '영업부 하반기 전략 회의 비용', 
//     type: '지출결의서', 
//     typeKey: 'payment', 
//     drafter: '성춘향 팀장', 
//     date: '2024-05-22', 
//     status: '결재 완료',
//     currentApprover: '김영희 대리',
//     approvalLine: [
//       { name: '홍길동', rank: '과장' },
//       { name: '김영희', rank: '대리' }
//     ]
//   },
//   { 
//     id: 204, 
//     title: '전사 하계 워크숍 장소 선정', 
//     type: '구매신청서', 
//     typeKey: 'purchase', 
//     drafter: '임꺽정 차장', 
//     date: '2024-05-23', 
//     status: '반려',
//     currentApprover: '오진우 회장',
//     approvalLine: [
//       { name: '박지민', rank: '대리' },
//       { name: '최유진', rank: '팀장' },
//       { name: '강하늘', rank: '본부장' },
//       { name: '한소희', rank: '대표' },
//       { name: '오진우', rank: '회장' }
//     ]
//   },
//   { 
//     id: 205, 
//     title: 'IT 자산 교체 주기 변경 기안', 
//     type: '일반품의서', 
//     typeKey: 'general', 
//     drafter: '장길산 대리', 
//     date: '2024-05-24', 
//     status: '결재 완료',
//     currentApprover: '박상무 상무',
//     approvalLine: [
//       { name: '박상무', rank: '상무' }
//     ]
//   },
//   { 
//     id: 206, 
//     title: '법인카드 부정 사용 방지 가이드라인', 
//     type: '일반품의서', 
//     typeKey: 'general', 
//     drafter: '홍길동 과장', 
//     date: '2024-05-25', 
//     status: '반려',
//     currentApprover: '최전무 전무',
//     approvalLine: [
//       { name: '이영희', rank: '과장' },
//       { name: '박지민', rank: '부장' },
//       { name: '최전무', rank: '전무' }
//     ]
//   },
// ];


// 결재선
const ApprovalLineStack = ({ line }) => {
  const displayLimit = 3;
  const displayLine = line.slice(0, displayLimit);
  const remainingCount = line.length > displayLimit ? line.length - displayLimit : 0;
  const token = useAuthStore(state => state.token);

  return (
    <div className="flex items-center">
      <div className="flex items-center -space-x-2">
        {displayLine.map((lineUser, index) => (
          <div
            key={index}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shadow-sm overflow-hidden relative group"
            title={`${lineUser.users_id} ${lineUser.rank_name}`}
          >
            <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-[10px] md:text-[11px] font-bold text-indigo-600 uppercase">
              <img src={`http://localhost/file/profile/view?sysname=${lineUser?.sysname}&token=${token}`}
                alt={lineUser?.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center shadow-sm z-10">
            <span className="text-[9px] md:text-[10px] font-bold text-indigo-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 결재 상태
const StatusBadge = ({ status }) => {
  const styles = {
    'DRAFT': 'bg-[#FFF9F0] text-[#FF9800] border-[#FFF9F0]',
    'APPROVED': 'bg-[#F0FDF4] text-[#10B981] border-[#F0FDF4]',
    'REJECTED': 'bg-[#FFF0F0] text-[#FF4D4F] border-[#FFF0F0]',
    'IN_PROGRESS': 'bg-blue-50 text-blue-600 border-blue-50',
  };

  const statusText = {
    'DRAFT': '결재 대기',
    'IN_PROGRESS': '진행 중',
    'APPROVED': '결재 완료',
    'REJECTED': '반려'
  };

  return (
    <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold border whitespace-nowrap ${styles[status] || 'bg-gray-50 text-gray-600'}`}>
      {statusText[status] || status}
    </span>
  );
};

// 현재 결재자
const DocumentTable = ({ title, data, onDetailClick, showPagination = true, approverLabel = '현재 결재자' }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const count = Math.ceil(data.length / itemsPerPage);
  const token = useAuthStore(state => state.token);
  const displayData = showPagination
    ? data.slice((page - 1) * itemsPerPage, page * itemsPerPage)
    : data;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3">
      <div className="pl-4 md:pl-6 pr-4 py-3 border-b border-slate-100 bg-white">
        <h3 className="text-base md:text-lg font-bold text-slate-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] md:min-w-full text-left border-collapse md:table-fixed">
          <thead>
            <tr className="bg-white text-gray-400 text-[0.8125rem] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="pl-4 md:pl-6 pr-3 py-3 font-bold w-[22%] whitespace-nowrap">제목</th>
              <th className="px-3 py-3 font-bold w-[11%] whitespace-nowrap">문서 종류</th>
              <th className="px-3 py-3 font-bold w-[12%] whitespace-nowrap">기안자</th>
              <th className="px-3 py-3 font-bold w-[18%] whitespace-nowrap">결재선</th>
              <th className="px-3 py-3 font-bold w-[12%] whitespace-nowrap">{approverLabel}</th>
              <th className="px-3 py-3 font-bold text-center w-[10%] whitespace-nowrap">결재 상태</th>
              <th className="px-3 py-3 font-bold text-center w-[11%] whitespace-nowrap">상세보기</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((doc) => (
              <tr key={doc.doc_seq} className="hover:bg-slate-50/50 transition-colors">
                <td className="pl-4 md:pl-6 pr-3 py-4 text-xs font-bold text-gray-700 truncate whitespace-nowrap">{doc.title}</td>
                <td className="px-3 py-4 text-xs font-medium text-gray-500 truncate whitespace-nowrap">{doc.doc_type}</td>
                <td className="px-3 py-4 truncate whitespace-nowrap">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] md:text-[10px]">
                      <img src={`http://localhost/file/profile/view?sysname=${doc?.sysname}&token=${token}`}
                        alt={doc?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 truncate">{doc.users_id}</span>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <ApprovalLineStack line={doc.approvers || []} />
                </td>
                <td className="px-3 py-4 text-xs font-bold text-gray-600 truncate whitespace-nowrap">
                  {doc.step_order}
                </td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <StatusBadge status={doc.status} />
                </td>
                <td className="px-3 py-4 text-center whitespace-nowrap">
                  <button
                    onClick={() => onDetailClick(doc)}
                    className="px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors border border-indigo-100 whitespace-nowrap"
                  >
                    상세보기
                  </button>
                </td>
              </tr>
            ))}
            {displayData.length === 0 && (
              <tr>
                <td colSpan="7" className="py-10 text-center text-gray-400 text-[0.7rem] font-bold">해당 문서가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showPagination && count > 0 && (
        <div className="py-2 scale-95 origin-center">
          <Pagination count={count} page={page} onChange={(_, value) => setPage(value)} />
        </div>
      )}
    </div>
  );
};

// 참조문서 출력 -> 참조문서 디테일로 이동
const ApprovalCc = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('전체');
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    getCcDocuments().then(resp => {
      console.log("문서 정보 확인 :", resp.data)
      setDocuments(resp.data);
    })
  }, [])
  const handleOpenDetail = (doc) => {
    navigate(`/approval/detail/${doc.doc_type}/${doc.doc_seq}`);
  };

  const filterDocuments = (status) => {
    return documents.filter(doc => {
      const matchesStatus = doc.status === status;
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '전체 문서' || selectedType === '전체' || doc.doc_type === selectedType;
      return matchesStatus && matchesSearch && matchesType;
    });
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto p-5 lg:p-6">
      <div className="max-w-[1440px] mx-auto space-y-10">

        {/* Title & Description */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">참조된 문서함</h1>
            <p className="text-xs text-slate-500 font-medium">나에게 참조된 문서들의 결재 상태를 확인하세요.</p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 w-full md:w-auto focus-within:ring-2 focus-within:ring-[#3530B8]/20 focus-within:border-[#3530B8] transition-all">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border-none rounded-lg focus:ring-0 text-slate-600 font-medium cursor-pointer outline-none"
            >
              <option>전체 문서</option>
              <option>일반품의서</option>
              <option>지출결의서</option>
              <option>휴가신청서</option>
              <option>구매신청서</option>
            </select>
            <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
            <div className="relative flex-1 md:w-56">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                placeholder="문서 제목 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border-none focus:ring-0 placeholder:text-slate-400 outline-none bg-transparent"
              />
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
              검색
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <DocumentTable
            title="결재 대기중"
            data={filterDocuments('DRAFT')}
            onDetailClick={handleOpenDetail}
            showPagination={false}
          />
          <DocumentTable
            title="결재 진행 중"
            data={filterDocuments('IN_PROGRESS')}
            onDetailClick={handleOpenDetail}
            showPagination={false}
          />
          <DocumentTable
            title="결재 완료"
            data={filterDocuments('APPROVED')}
            onDetailClick={handleOpenDetail}
            showPagination={true}
            approverLabel="최종 결재자"
          />
          <DocumentTable
            title="결재 반려"
            data={filterDocuments('REJECTED')}
            onDetailClick={handleOpenDetail}
            showPagination={true}
            approverLabel="최종 결재자"
          />
        </div>
      </div>
    </div>
  );
};

export default ApprovalCc;
