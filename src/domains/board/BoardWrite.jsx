import { useState, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // 기본 스노우 테마 CSS 로드

const CATEGORIES_HR   = ['공지', '경조', '생일', '승진', '부서 이동'];
const CATEGORIES_ALL  = ['공지', '이벤트', '인사/총무', '자유', '프로젝트'];

// 현재 로그인 유저 (실제로는 store에서)
const MOCK_USER = { role: 'HR' }; // 'HR' | 'USER'

const BoardWrite = () => {
  // 실제 사용 시 → const { user } = useUserStore();
  const user = MOCK_USER;
  const isHR = user?.role === 'HR' || user?.auth_group === 'ROLE_HR';
  const categories = isHR ? CATEGORIES_HR : CATEGORIES_ALL;

  // 툴바 설정 (컴포넌트 리렌더링 시 에디터 깜빡임 방지용 useMemo)
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],               // 제목 크기
      ['bold', 'italic', 'underline', 'strike'],     // 글자 스타일링
      [{ color: [] }, { background: [] }],          // 글자/배경 색상
      [{ list: 'ordered' }, { list: 'bullet' }],    // 리스트
      [{ align: [] }],                              // 정렬
      ['image', 'link'],                            // 이미지, 링크
      ['clean'],                                    // 포맷 초기화
    ],
  }), []);

  // form 객체 내부에 content를 함께 관리하도록 유지
  const [form, setForm] = useState({
    category: categories[0],
    title: '',
    content: '',
  });
  
  const [files, setFiles] = useState([]); // 첨부파일 목록
  const [errors, setErrors] = useState({});// 유효성 검사 에러
  const fileInputRef = useRef(null);
//에러가 있던 필드를 수정하면 에러도 같이 지워줌
  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
  };

  // 에디터 내용 변경 핸들러 Quill은 아무것도 안 써도 <p><br></p>를 반환
  const handleEditorChange = (value) => {
    // 빈 공백만 있는 태그인 경우 유효성 검사를 위해 빈 문자열로 처리
    const cleanValue = value === '<p><br></p>' ? '' : value;
    set('content', cleanValue);
  };

  const handleFileAdd = (e) => {
    const added = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...added]);
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    setFiles(prev => [...prev, ...dropped]);
  };

  const removeFile = (idx) =>
    setFiles(prev => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
//유효성 검사
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = true;
    if (!form.content.trim()) e.content = true; // 에디터의 HTML 문자열 검증
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    // 백엔드로 보낼 최종 데이터 확인 구조
    console.log("제출 데이터:", {
      ...form,
      files: files
    });
    
    // TODO: API 호출 (axios.post('/api/board', formData)...)
    alert('게시글이 등록되었습니다.');
  };

  const handleCancel = () => {
    // TODO: navigate(-1)
    alert('취소');
  };

  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-6 md:p-8 lg:px-10 bg-white font-sans items-center">

      {/* 페이지 헤더 */}
      <div className="w-full max-w-5xl mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">사내 게시판</h1>
        <p className="text-[0.85rem] text-gray-500 font-medium">공지사항, 이벤트, 자유게시글을 확인하세요</p>
      </div>

      {/* 카드 */}
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-50">
          <h3 className="text-sm font-extrabold text-indigo-950">게시글 작성</h3>
        </div>

        {/* 폼 본문 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
          `}</style>
          <div className="w-full space-y-6">

            {/* 카테고리 + 제목 한 줄 (데스크톱) */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* 카테고리 */}
              <div className="md:w-44 shrink-0">
                <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">
                  카테고리
                </label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-400 transition-all pr-9"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* 제목 */}
              <div className="flex-1">
                <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">
                  제목
                </label>
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 transition-all placeholder:text-gray-300
                    ${errors.title
                      ? 'border-red-400 ring-4 ring-red-100'
                      : 'border-gray-200 focus:ring-indigo-600/5 focus:border-indigo-400'
                    }`}
                />
                {errors.title && (
                  <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">제목을 입력해주세요.</p>
                )}
              </div>
            </div>

            {/* 내용 에디터 영역 */}
            <div>
              <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">
                내용
              </label>
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }

                /* ✅ Quill 툴바 */
                .ql-toolbar.ql-snow {
                  border: 1px solid #E5E7EB !important;   /* border-gray-200 */
                  border-bottom: none !important;
                  border-radius: 16px 16px 0 0 !important; /* rounded-t-2xl */
                  background-color: #F9FAFB;
                }

                /* ✅ Quill 에디터 본문 */
                .ql-container.ql-snow {
                  border: 1px solid #E5E7EB !important;   /* border-gray-200 */
                  border-radius: 0 0 16px 16px !important; /* rounded-b-2xl */
                  font-size: 0.875rem;
                }

                /* ✅ 에러 상태 */
                .ql-error .ql-toolbar.ql-snow {
                  border-color: #F87171 !important;
                }
                .ql-error .ql-container.ql-snow {
                  border-color: #F87171 !important;
                  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.1);
                }
              `}</style>
              {/* 에디터 컴포넌트 감싸기 및 Tailwind 커스텀 */}
              <div className={
                `w-full min-h-[360px] pb-12
                [&>.ql-toolbar]:bg-gray-50 // 툴바 배경색 연한 회색
                [&>.ql-toolbar]:border-gray-200 // 툴바 테두리 연한 회색
                [&>.ql-toolbar]:rounded-t-2xl // 툴바 위쪽만 둥글게
                [&>.ql-container]:border-gray-200 // 에디터 본문 테두리 연한 회색
                [&>.ql-container]:rounded-b-2xl  // 에디터 본문 아래쪽만 둥글게
                [&>.ql-container]:text-sm // 에디터 본문 폰트 사이즈
                ${errors.content ? '[&>.ql-toolbar]:border-red-400 [&>.ql-container]:border-red-400 [&>.ql-container]:ring-4 [&>.ql-container]:ring-red-100' : ''}
              `}>
                <ReactQuill 
                  theme="snow"
                  value={form.content}
                  onChange={handleEditorChange}
                  modules={modules}
                  className="h-72"
                  placeholder="내용을 입력하세요..."
                />
              </div>
              {errors.content && (
                <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">내용을 입력해주세요.</p>
              )}
            </div>

            {/* 첨부파일 */}
            <div>
              <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">
                첨부파일
              </label>

              {/* 드래그 존 */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-indigo-50/40 hover:border-indigo-300 transition-all cursor-pointer group"
              >
                <svg className="w-8 h-8 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3M4.5 19.5h15a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.5-1.5h-4.379a1.5 1.5 0 0 1-1.06-.44L13.94 5.44A1.5 1.5 0 0 0 12.879 5H4.5A1.5 1.5 0 0 0 3 6.5v11.5A1.5 1.5 0 0 0 4.5 19.5z"/>
                </svg>
                <p className="text-xs font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">
                  드래그하거나 클릭해서 업로드
                </p>
                <p className="text-[11px] text-gray-300">최대 10MB, 모든 파일 형식 지원</p>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
              </div>

              {/* 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl group hover:border-indigo-100 transition-all">
                      <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                      </svg>
                      <span className="flex-1 text-xs font-bold text-gray-600 truncate">{file.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{formatSize(file.size)}</span>
                      <button onClick={() => removeFile(idx)}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4 pb-2">
              <button
                onClick={handleSubmit}
                className="flex-1 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100"
              >
                등록
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-500 text-sm font-bold rounded-2xl hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                취소
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardWrite;