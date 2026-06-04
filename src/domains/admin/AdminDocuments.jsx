import React, { useState, useEffect, useCallback } from 'react';
import Pagination from '../../components/common/Pagination';
import useUserStore from '../../store/userStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faCloudUploadAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useDropzone } from 'react-dropzone';
import { createDocument, deleteDocument, editDocument, getAllDocs } from './adminApi';
import useAuthStore from '../../store/authStore';

const AdminDocuments = () => {
  const { user } = useUserStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState([]);
  
  // 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSeq, setEditingSeq] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [titleError, setTitleError] = useState('');
  const [fileError, setFileError] = useState('');

  const token = useAuthStore(state => state.token);

  // 문서 불러오기
  const loadDocuments = () => {
    getAllDocs().then(resp => {
      console.log(resp.data[0]);
      setDocuments(resp.data);
    }).catch(err => console.error("목록 로드 실패:", err));
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  // Dropzone 설정
  const onDrop = useCallback(acceptedFiles => {
    setUploadedFiles(acceptedFiles);
    if (acceptedFiles.length > 0) {
      setFileError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
    // 이미지
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    
    // PDF
    'application/pdf': ['.pdf'],
    
    // MS Word
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    
    // MS Excel
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    
    // MS PowerPoint
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  
    // 한글 파일
    'application/x-hwp': ['.hwp'],

    // 텍스트 파일
    'text/plain': ['.txt']
  },
    maxFiles: 1,
    multiple: false
  });

  // 검색 로직
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  // 페이지네이션 관련 계산
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const displayedDocs = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleEdit = (document_seq) => {
    const docToEdit = documents.find(d => d.document_seq === document_seq);
    if (docToEdit) {
      setIsEditMode(true);
      setEditingSeq(document_seq);
      setNewDocTitle(docToEdit.title);
      setUploadedFiles([]);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (document_seq) => {
    if (window.confirm('정말 삭제하시겠습니까?\n삭제 시 복구가 불가합니다.')) {
      try {
        await deleteDocument(document_seq);
        alert('문서가 삭제되었습니다.');
        loadDocuments();
      } catch (error) {
        console.error('문서 삭제 실패:', error);
        alert('문서 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setEditingSeq(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingSeq(null);
    setNewDocTitle('');
    setUploadedFiles([]);
    setTitleError('');
    setFileError('');
  };

  const handleRegister = async () => {
    let hasError = false;

    if (!newDocTitle.trim()) {
      setTitleError('제목을 입력해주세요.');
      hasError = true;
    } else {
      setTitleError('');
    }
    
    if (!isEditMode && uploadedFiles.length === 0) {
      setFileError('파일을 첨부해주세요.');
      hasError = true;
    } else {
      setFileError('');
    }

    if (hasError) return;
    
    const formData = new FormData();
    formData.append('title', newDocTitle);
    
    try{
      if (isEditMode) {
        formData.append('document_seq', editingSeq);
        if (uploadedFiles.length > 0) {
          formData.append('file', uploadedFiles[0]);
        }
        await editDocument(formData);
        alert('문서가 수정되었습니다.');
      } else {
          if (user && user.id) {
            formData.append('users_id', user.id);
          }
          formData.append('file', uploadedFiles[0]);
          await createDocument(formData);
          alert('문서가 등록되었습니다.');
        }
          handleModalClose();
          loadDocuments();
      }catch (error) {
          console.error('문서 등록 실패:', error);
          alert('문서 등록 중 오류가 발생했습니다.');
      }
  };

  // 권한 체크 함수
  const canManage = (users_id) => {
    if (!user) return false;
    // 슈퍼 어드민이거나, 본인이 작성한 문서인 경우
    return user.auth_group === 'ROLE_SUPER_ADMIN' || user.id === users_id;
  };

  const handlePreview = (sysname, mimeType) => {
    const fileUrl = `http://localhost/file/preview/${sysname}?token=${token}`;
    
    // PDF, 이미지는 바로 열기
    if (mimeType?.startsWith('image/') || mimeType === 'application/pdf') {
      window.open(fileUrl, '_blank');
    } else {
      // Office 파일은 Google Docs Viewer로
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}`, '_blank');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white font-sans p-6 md:p-8">
      {/* [1] 헤더 및 검색/버튼 영역 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 flex-shrink-0">
        <div className="space-y-1">
          <h1 className="text-[1.5rem] font-bold text-slate-900 mb-1 tracking-tight">문서 관리</h1>
          <p className="text-[0.6875rem] md:text-sm text-gray-500 whitespace-nowrap">자료실에 올라와 있는 문서를 관리할 수 있습니다.</p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative group w-full md:w-72 flex-shrink-0">
            <input 
              type="text" 
              placeholder="문서 제목으로 검색"
              value={searchKeyword}
              onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl 
              focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all placeholder:text-gray-300 text-sm text-gray-700 shadow-sm"/>
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#3530B8] transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button 
            onClick={handleCreate}
            className="px-6 py-2.5 bg-[#3530B8] text-white text-sm font-bold rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            새 문서
          </button>
        </div>
      </div>

      {/* [3] 목록 영역 */}
      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
          <table className="w-full text-left border-collapse mt-6">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-130">제목</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-50">작성자</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider w-35">등록일</th>
                <th className="pb-4 text-[0.6875rem] font-bold text-slate-400 tracking-wider text-center w-50">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedDocs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    문서가 없습니다.
                  </td>
                </tr>
              ) : (
                displayedDocs.map((doc) => (
                  <tr key={doc.document_seq} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 text-sm font-semibold text-slate-800">
                      {/* <a 
                        href={`http://localhost/file/preview/${doc.file_sysname}?token=${token}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-[#3530B8] hover:underline cursor-pointer"
                      >
                        {doc.title}
                      </a> */}
                      <button
                        onClick={() => handlePreview(doc.file_sysname, doc.mime_type)}
                        className="hover:text-[#3530B8] hover:underline cursor-pointer text-left"
                      >
                        {doc.title}
                      </button>
                    </td>
                    <td className="py-4 text-xs text-slate-500 font-medium">
                      {doc.users_id}
                    </td>
                    <td className="py-4 text-[0.6875rem] text-slate-400 font-mono">
                      {doc.created_at?.substring(0, 10)}
                    </td>
                    <td className="py-4 text-center">
                      {canManage(doc.users_id) ? (
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEdit(doc.document_seq)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-[#3530B8] transition-all flex items-center justify-center cursor-pointer"
                            title="수정"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-xs" />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc.document_seq)}
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center cursor-pointer"
                            title="삭제"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[0.625rem] text-slate-300 font-medium">권한 없음</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-50 bg-white rounded-b-[32px] py-2">
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
          />
        </div>
      </div>

      {/* 새 문서 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{isEditMode ? '문서 수정' : '새 문서 등록'}</h2>
              <button onClick={handleModalClose} className="text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">문서 제목</label>
                <input 
                  type="text" 
                  value={newDocTitle}
                  onChange={(e) => {
                    setNewDocTitle(e.target.value);
                    if (e.target.value.trim()) setTitleError('');
                  }}
                  placeholder="제목을 입력하세요"
                  className={`w-full px-4 py-3 bg-gray-50 border ${titleError ? 'border-red-500' : 'border-gray-100'} rounded-xl focus:bg-white focus:border-[#3530B8] focus:ring-4 focus:ring-[#3530B8]/5 outline-none transition-all text-sm font-medium`}
                />
                {titleError && <p className="text-red-500 text-[11px] mt-1 ml-1">{titleError}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">{isEditMode ? '파일 변경 (선택)' : '파일 업로드'}</label>
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer
                    ${isDragActive ? 'border-[#3530B8] bg-[#3530B8]/5' : fileError ? 'border-red-500 bg-red-50/30' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                >
                  <input {...getInputProps()} />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDragActive ? 'bg-[#3530B8] text-white' : fileError ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="text-xl" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${fileError ? 'text-red-600' : 'text-gray-700'}`}>
                      {uploadedFiles.length > 0 ? uploadedFiles[0].name : isEditMode ? '기존 파일을 유지하려면 비워두세요' : '파일을 드래그하거나 클릭하세요'}
                    </p>
                    <p className={`text-[0.625rem] mt-1 ${fileError ? 'text-red-400' : 'text-gray-400'}`}>최대 20MB까지 업로드 가능</p>
                  </div>
                </div>
                {fileError && <p className="text-red-500 text-[11px] mt-1 ml-1">{fileError}</p>}
              </div>
            </div>

            <div className="p-6 border-t border-gray-50 flex gap-3 bg-white">
              <button 
                onClick={handleModalClose}
                className="flex-1 py-3 border border-gray-200 text-gray-500 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all cursor-pointer">
                취소
              </button>
              <button 
                onClick={handleRegister}
                className="flex-[2] py-3 bg-[#3530B8] text-white text-sm font-bold rounded-xl hover:bg-[#2a2594] shadow-lg shadow-[#3530B8]/20 transition-all cursor-pointer">
                {isEditMode ? '수정 완료' : '등록'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
      `}} />
    </div>
  );
};

export default AdminDocuments;
