import { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // 기본 스노우 테마 CSS 로드
import { maxios } from "../../api/axiosConfig";
import { useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import { insertBoard, insertEditorImage, updateBoard } from './boardApi';
import { alertSuccess, alertError } from '../../utils/alert';

// 💡 폰트 크기 whitelist를 숫자(px) 단위로 등록
const Size = Quill.import('attributors/style/size');
Size.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px','64px', '72px'];
Quill.register(Size, true);

const CATEGORIES_HR = ['공지', '경조', '생일', '승진', '부서 이동', '자유'];

const BoardWrite = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const location = useLocation();
  const editPost = location.state?.post ?? null;
  const isEdit = !!editPost; // 수정 모드 여부
  const quillRef = useRef(null); // 💡 에디터 객체에 직접 접근하기 위한 Ref 추가
  const fileInputRef = useRef(null);
  const categoryRef = useRef(null);

  const isHR = user?.auth_group === 'ROLE_HR_ADMIN' || user?.auth_group === 'ROLE_SUPER_ADMIN';
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };

    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

  const [form, setForm] = useState({
    category: editPost?.category || (isHR ? CATEGORIES_HR[0] : '자유'),
    title: editPost?.title || '',
    content: editPost?.content || '',
  });

  // 기존 파일 (서버에 이미 있는 것)
  const [existingFiles, setExistingFiles] = useState(editPost?.files || []);
  // 삭제할 파일 seq 목록
  const [deletedFileSeqs, setDeletedFileSeqs] = useState([]);
  //새로 등록할 파일
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});

  // 제목 변경 핸들러 (글자수 제한 적용)
  const handleTitleChange = (e) => {
    const val = e.target.value;
    if ([...val].length <= 66) {
      set('title', val);
    }
  };

  // URL 추출 유틸 함수(수정->에디터 이미지 삭제용)
  const extractImageUrls = (html) => {
    const matches = html.matchAll(/<img[^>]+src="([^"]+)"/g);
    return [...matches].map(m => m[1]);
  };

  // 💡 [달라진 점 2] 툴바 및 핸들러 매핑 최적화
  const modules = useMemo(() => {
    // 💡 [달라진 점 1] 이미지 커스텀 업로드 핸들러
    const imageHandler = () => {
      // 1. 이미지를 선택할 수 있는 가상 input 생성
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');
      input.click();

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;

        // 이미지 파일 서버 전송용 FormData 생성
        const formData = new FormData();
        formData.append('image', file);
        // 2. 백엔드의 이미지 업로드 전용 API 호출
        // (주의: 이 API는 업로드된 이미지의 저장소 'URL 경로'를 문자열로 리턴해야 함)
        insertEditorImage(formData).then((resp) => {
          let imageUrl = resp.data.url.replace(
            /^http:\/\/localhost/,
            import.meta.env.VITE_API_BASE_URL
          );
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          quill.insertEmbed(range ? range.index : 0, 'image', imageUrl);
          quill.setSelection((range ? range.index : 0) + 1); //커서 다음으로
        }).catch((error) => {
          console.error('이미지 업로드 실패:', error);
          alertError('오류 발생', '이미지 업로드 중 오류가 발생했습니다.');
        });
      };
    };
    const isMobile = window.innerWidth < 768;

    return {
      toolbar: {
        container: isMobile ? [
          ['bold', 'italic', 'underline'],
          [{ size: ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px', '64px', '72px'] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['image', 'link'],
        ] : [
          [{ size: ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px', '64px', '72px'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['image', 'link'], // 이미지 포함
          ['clean'],
        ],
        handlers: {
          image: imageHandler, // 비디오 핸들러 등이 필요하면 여기에 추가 매핑 가능
        }
      }
    };
  }, []);

  if (user === null) {
    return <div>로딩 중...</div>;
  }

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: false }));
  };

  const handleCategoryChange = (valueOrEvent) => {
    const newCategory = typeof valueOrEvent === 'string' ? valueOrEvent : valueOrEvent.target.value;
    set('category', newCategory);
    // 제목 앞의 기존 [태그] 제거 후 새 태그 삽입
    const stripped = form.title.replace(/^\[[^\]]*\]\s*/, '');
    //stripped는 기존 제목에서 [이전태그] 를 제거한 순수 제목 텍스트
    set('title', newCategory === '자유' ? stripped : `[${newCategory}] ${stripped}`);
  };

  const handleEditorChange = (value) => {
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

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const removeExistingFile = (fileSeq) => {
    setExistingFiles(prev => prev.filter(f => f.file_seq !== fileSeq));
    setDeletedFileSeqs(prev => [...prev, fileSeq]);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 💡 [달라진 점 3] 정교해진 유효성 검사 (HTML 태그 제거 후 공백 체크)
  const validate = () => {
    const e = {};
    if (!form.title.trim()) {
      e.title = true;
    } else if ([...form.title].length > 66) {
      e.title = true;
    }

    // HTML 태그를 모두 제거하고 알맹이 텍스트만 추출
    const pureText = form.content.replace(/<[^>]*>/g, '').trim();
    // 만약 이미지만 한 장 달랑 들어있을 때는 텍스트가 0이므로, img 태그가 포함되어 있는지도 함께 체크
    const hasImage = form.content.includes('<img');

    if (!pureText && !hasImage) {
      e.content = true;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // 💡 [달라진 점 4] FormData를 이용한 최종 게시글 등록(Insert) 처리
  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = new FormData();
    // 일반 폼 데이터 바인딩
    formData.append('category', isHR ? form.category : '자유');
    formData.append('title', form.title);
    formData.append('content', form.content); // Quill의 HTML 문자열이 그대로 전송됨
    // 일반 첨부파일 배열 바이딩
    files.forEach((file) => {
      formData.append(isEdit ? 'newFiles' : 'files', file);
    });

    if (isEdit) {
      //HTML 문자열에서 <img src="URL"> 패턴을 찾아서 URL만 배열로 뽑아주는 함수
      const extractImageUrls = (html) => {
        const matches = html.matchAll(/<img[^>]+src="([^"]+)"/g);
        return [...matches].map(m => m[1]);
      };
      //수정 전 원본 이미지 URL
      const originalUrls = extractImageUrls(editPost.content);
      //현재 에디터에 남아있는 content에서 이미지 URL 목록 추출
      const currentUrls = extractImageUrls(form.content);
      //원본에는 있었는데 현재에는 없는 URL(삭제한) 추추ㄹ
      const deletedImageUrls = originalUrls.filter(url => !currentUrls.includes(url));

      //삭제된 이미지 URL들을 formData에 담아 백엔드로 전송
      deletedImageUrls.forEach(url => formData.append('deletedImageUrls', url));
      //첨부파일
      deletedFileSeqs.forEach(seq => formData.append('deletedFileSeqs', seq));
    }

    if (isEdit) {
      updateBoard(editPost.post_seq, formData).then(() => {
        navigate(`/boardDetail/${editPost.post_seq}`, { state: { alert: { type: 'success', title: '수정 완료', text: '게시글이 수정되었습니다.' } } });
      }).catch(err => {
        console.error(err);
        alertError('오류 발생', '수정 중 오류가 발생했습니다.');
      });
    } else {
      insertBoard(formData).then(() => {
        navigate('/board', { state: { alert: { type: 'success', title: '등록 완료', text: '게시글이 등록되었습니다.' } } });
      }).catch(err => {
        console.error(err);
        alertError('오류 발생', '등록 중 오류가 발생했습니다.');
      });
    }
  };

  const handleCancel = () => { navigate(-1); };

  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-6 md:p-8 lg:px-10 bg-white font-sans items-center">

      {/* 페이지 헤더 */}
      <div className="w-full mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">사내 게시판</h1>
      </div>

      {/* 카드 */}
      <div className="w-full h-[90vh] max-w-7xl bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

        {/* 카드 헤더 */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-50">
          <h3 className="text-sm font-extrabold text-indigo-950">{isEdit ? '게시글 수정' : '게시글 작성'}</h3>
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
              {/* 카테고리 - 인사팀만 노출 */}
              {isHR && (
                <div className="md:w-44 shrink-0">
                  <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-2 block">
                    카테고리
                  </label>
                  <div className="relative" ref={categoryRef}>
                    <div
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className={`w-full px-4 py-3 bg-white border ${isCategoryOpen ? 'border-indigo-400 ring-4 ring-indigo-600/5' : 'border-gray-200'
                        } rounded-2xl text-sm font-bold text-gray-700 transition-all cursor-pointer flex justify-between items-center`}
                    >
                      <span>{form.category}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {isCategoryOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                        {CATEGORIES_HR.map((c) => (
                          <div
                            key={c}
                            onClick={() => {
                              handleCategoryChange(c);
                              setIsCategoryOpen(false);
                            }}
                            className="px-4 py-3 text-sm hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer font-bold text-gray-700 border-b border-gray-50 last:border-0"
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 제목 */}
              <div className={`flex-1 ${!isHR ? 'w-full' : ''}`}>
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider block">
                    제목
                  </label>
                  <span className={`text-[10px] font-bold ${[...form.title].length >= 66 ? 'text-red-500' : 'text-gray-400'}`}>
                    {[...form.title].length} / 66자
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="제목을 입력하세요"
                  value={form.title}
                  onChange={handleTitleChange}
                  className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 transition-all placeholder:text-gray-300
                    ${errors.title
                      ? 'border-red-400 ring-4 ring-red-100'
                      : 'border-gray-200 focus:ring-indigo-600/5 focus:border-indigo-400'
                    }`}
                />
                {errors.title && (
                  <p className="text-[11px] text-red-500 font-bold mt-1.5 ml-1">
                    {form.title.trim() === '' ? '제목을 입력해주세요.' : '제목은 66자 이내로 입력해주세요.'}
                  </p>
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
                /* Quill 에디터 내부 스크롤 제거 */
                .ql-editor {
                  min-height: 400px;
                }

                /* ✅ 에러 상태 */
                .ql-error .ql-toolbar.ql-snow {
                  border-color: #F87171 !important;
                }
                .ql-error .ql-container.ql-snow {
                  border-color: #F87171 !important;
                  box-shadow: 0 0 0 4px rgba(248, 113, 113, 0.1);
                }

                /* ✅ 폰트 크기 드롭다운 - 숫자로 표시 */
                .ql-snow .ql-picker.ql-size .ql-picker-label::before,
                .ql-snow .ql-picker.ql-size .ql-picker-item::before {
                  content: attr(data-value) !important;
                }

                /* 기본값(설정 안 했을 때 normal) 라벨 처리 */
                .ql-snow .ql-picker.ql-size .ql-picker-label[data-value=""]::before,
                .ql-snow .ql-picker.ql-size .ql-picker-item[data-value=""]::before {
                  content: '기본' !important;
                }

                /* 드롭다운 너비가 좁으면 숫자가 잘릴 수 있어 살짝 넓혀줌 */
                .ql-snow .ql-picker.ql-size {
                  width: 70px !important;
                }
              `}</style>
              {/* 에디터 컴포넌트 감싸기 및 Tailwind 커스텀 */}
              <div className={
                `w-full min-h-[500px] pb-12
                [&>.ql-toolbar]:bg-gray-50 // 툴바 배경색 연한 회색
                [&>.ql-toolbar]:border-gray-200 // 툴바 테두리 연한 회색
                [&>.ql-toolbar]:rounded-t-2xl // 툴바 위쪽만 둥글게
                [&>.ql-container]:border-gray-200 // 에디터 본문 테두리 연한 회색
                [&>.ql-container]:rounded-b-2xl  // 에디터 본문 아래쪽만 둥글게
                [&>.ql-container]:text-sm // 에디터 본문 폰트 사이즈
                ${errors.content ? '[&>.ql-toolbar]:border-red-400 [&>.ql-container]:border-red-400 [&>.ql-container]:ring-4 [&>.ql-container]:ring-red-100' : ''}
              `}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={form.content}
                  onChange={handleEditorChange}
                  modules={modules}
                  className=""
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3M4.5 19.5h15a1.5 1.5 0 0 0 1.5-1.5v-9a1.5 1.5 0 0 0-1.5-1.5h-4.379a1.5 1.5 0 0 1-1.06-.44L13.94 5.44A1.5 1.5 0 0 0 12.879 5H4.5A1.5 1.5 0 0 0 3 6.5v11.5A1.5 1.5 0 0 0 4.5 19.5z" />
                </svg>
                <p className="text-xs font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">
                  드래그하거나 클릭해서 업로드
                </p>
                <p className="text-[11px] text-gray-300">최대 10MB, 모든 파일 형식 지원</p>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileAdd} />
              </div>

              {/* 수정모드 파일 */}
              {isEdit && existingFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {existingFiles.map((file) => (
                    <div key={file.file_seq} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl group hover:border-indigo-100 transition-all">
                      <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="flex-1 text-xs font-bold text-gray-600 truncate">{file.file_oriname}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{(file.file_size / 1024).toFixed(1)} KB</span>
                      <button onClick={() => removeExistingFile(file.file_seq)}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 파일 목록 */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-100 rounded-2xl group hover:border-indigo-100 transition-all">
                      <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="flex-1 text-xs font-bold text-gray-600 truncate">{file.name}</span>
                      <span className="text-[11px] text-gray-400 shrink-0">{formatSize(file.size)}</span>
                      <button onClick={() => removeFile(idx)}
                        className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M6 18L18 6M6 6l12 12" />
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
                {isEdit ? '수정 완료' : '등록'}
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