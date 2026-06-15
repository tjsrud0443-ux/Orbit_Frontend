import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maxios } from "../../api/axiosConfig";
import useUserStore from '../../store/userStore';
import DOMPurify from 'dompurify';
//이걸 import 해야 에디터에서 작성한 글, 이미지, 굵기 등 서식이 그대로
import 'react-quill-new/dist/quill.snow.css';
import { getPostDetail, deletePost, downFiles, insertComment, deleteComment, updateComment } from './boardApi';
import { alertSuccess, alertError, alertConfirm } from '../../utils/alert';

const BoardDetail = () => {
  const { seq } = useParams();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const { user } = useUserStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [editingCommentSeq, setEditingCommentSeq] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const hasFetched = useRef(false);

  // 카테고리별 스타일 매핑
  const getCategoryStyle = (category) => {
    switch (category) {
      case '공지': return 'bg-rose-50 text-rose-600 border-rose-100';
      case '경조': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case '생일': return 'bg-pink-50 text-pink-600 border-pink-100';
      case '승진': return 'bg-amber-50 text-amber-600 border-amber-100';
      case '부서 이동': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  useEffect(() => {        
    if (hasFetched.current) return;
    hasFetched.current = true;

    getPostDetail(seq).then(resp => {
      setPost(resp.data);
      // 게시글 상세 데이터에 댓글이 포함되어 있다고 가정합니다.
      if (resp.data.comments) {
        setComments(resp.data.comments);
      }
    })
    .catch(err => {
      console.error('게시글 상세 조회 실패:', err);
      alertError('오류 발생', '게시글 로드 중 오류가 발생했습니다.');
      navigate('/board');
    })
    .finally(() => {
      setLoading(false);
    });
  }, [seq, navigate]);

  const handleCommentSubmit = () => {
    if (!commentInput.trim()) return;
    
    insertComment(seq, commentInput).then(() => {
      setCommentInput('');
      getPostDetail(seq).then(resp => {
        if (resp.data.comments) setComments(resp.data.comments);
      });
  }).catch(err => {
    console.error(err);
    alertError('오류 발생', '댓글 등록 중 오류가 발생했습니다.');
  });
  };

  const handleCommentDelete = async (commentSeq) => {
    const result = await alertConfirm('정말 삭제하시겠습니까?', '삭제 후 복구는 불가합니다.');
    if (!result.isConfirmed) return;
    try {
      await deleteComment(commentSeq);
      setComments(prev => prev.filter(c => c.comment_seq !== commentSeq));
    } catch (err) {
      console.error(err);
      alertError('오류 발생', '댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCommentUpdate = (commentSeq) => {
    if (!editingContent.trim()) return;

    updateComment(commentSeq, { content: editingContent }).then(() => {
      setEditingCommentSeq(null);
      setEditingContent('');
      getPostDetail(seq).then(resp => {
        if (resp.data.comments) setComments(resp.data.comments);
      });
    }).catch(err => {
      console.error(err);
      alertError('오류 발생', '댓글 수정 중 오류가 발생했습니다.');
    });
  };

  const handleDelete = async () => {
    const result = await alertConfirm('정말 삭제하시겠습니까?', '삭제 후 복구는 불가합니다.');
    if (!result.isConfirmed) return;
    try {
      await deletePost(seq);
      alertSuccess('삭제 완료', '게시글 삭제가 완료되었습니다.');
      navigate('/board');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alertError('오류 발생', '게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = () => {
    navigate(`/BoardWrite/${seq}`, { state: { post } });
  };

  const handleDownload = (fileSeq, fileName) => {
    downFiles(fileSeq).then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => {
        console.error('파일 다운로드 실패:', err);
        alertError('오류 발생', '다운로드 중 오류가 발생했습니다.');
      });
  };

  if (loading) return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!post) return null;

  // 본인 확인 (작성자 ID와 현재 로그인 유저 ID 비교)
  // 프로젝트 내 여러 컴포넌트(AdminDocuments, MinutesList 등)의 패턴을 참고하여 
  // 가장 범용적인 id와 users_id 필드를 우선적으로 체크합니다.
  const isAuthor = 
    (!!user?.id && !!post?.users_id && String(user.id) === String(post.users_id)) ||
    (!!user?.users_seq && !!post?.users_seq && String(user.users_seq) === String(post.users_seq)) ||
    (!!user?.emp_seq && !!post?.emp_seq && String(user.emp_seq) === String(post.emp_seq));

  return (
    <div className="w-full h-auto lg:h-full flex flex-col p-6 md:p-8 lg:px-10 bg-white font-sans items-center">
      {/* 카드 */}
      <div className="w-full h-[90vh] max-w-7xl bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* 카드 헤더 (카테고리 & 목록가기) */}
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-50 bg-gray-50/30">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getCategoryStyle(post.category)}`}>
              {post.category}
            </span>
            <h3 className="text-sm font-extrabold text-indigo-950 truncate max-w-md">
              게시글 상세보기
            </h3>
          </div>

        </div>

        {/* 게시글 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 8px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { 
              background: #E5E7EB; 
              border-radius: 10px; 
              border: 2px solid transparent; /* 여백 효과 */
              background-clip: padding-box; 
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; border: 2px solid transparent; background-clip: padding-box; }
            
            /* Quill 에디터 스타일 대응 */
            .post-content img { max-width: 100%; height: auto; border-radius: 12px; margin: 20px 0; }
            .post-content p { margin-bottom: 1rem; line-height: 1.7; color: #374151; }
            .post-content h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 1rem; }
            .post-content h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.75rem; }
          `}</style>

          {/* 제목 및 정보 세션 */}
          <div className="mb-8 border-b border-gray-100 pb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-[0.8rem]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-xs">
                  {post.author_sysname ? (
                    <img
                      src={`http://localhost/file/profile/view?sysname=${post.author_sysname}&token=${token}`}
                      alt={post.author_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    post.author_name?.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{post.author_name}</p>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-gray-200 hidden sm:block"></div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/>
                  </svg>
                  작성일: {post.created_at?.replace('T', ' ').slice(0, 11)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  조회수: {post.view_count}
                </span>
              </div>
            </div>
          </div>

          {/* 본문 내용 */}
          <div 
            className="post-content min-h-[300px] text-sm md:text-base"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content)}}
          />

          {/* 첨부파일 영역 */}
          {post.files && post.files.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <label className="text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider mb-4 block">
                첨부파일 ({post.files.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {post.files.map((file, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleDownload(file.file_seq, file.file_oriname)}
                    className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-indigo-600 transition-colors">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">{file.file_oriname}</p>
                      <p className="text-[10px] text-gray-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                    </div>
                    <svg className="text-gray-300 group-hover:text-indigo-400 transition-colors" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 댓글 영역 */}
          <div className="mt-16 pt-10 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-8">
              <h3 className="text-lg font-extrabold text-gray-900">댓글</h3>
              <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            </div>

            {/* 댓글 목록 */}
            <div className="space-y-8 mb-10">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.comment_seq} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                      {comment.author_sysname ? (
                        <img
                          src={`http://localhost/file/profile/view?sysname=${comment.author_sysname}&token=${token}`}
                          alt={comment.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm bg-gray-50">
                          {comment.author_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5 overflow-hidden">
                        <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
                          <span className="font-bold text-gray-900 text-sm shrink-0">{comment.author_name}</span>
                          <span className="text-[11px] text-gray-400 truncate">
                            {comment.update_at 
                              ? `${comment.update_at.replace('T', ' ').slice(0, 16)} (수정됨)` 
                              : comment.created_at?.replace('T', ' ').slice(0, 16)}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {editingCommentSeq === comment.comment_seq ? (
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => {
                                if ([...e.target.value].length <= 900) {
                                  setEditingContent(e.target.value);
                                }
                              }}
                              className="w-full border border-indigo-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[80px] custom-scrollbar"
                            />
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold ${[...editingContent].length >= 899 ? 'text-rose-500' : 'text-gray-400'}`}>
                                {[...editingContent].length} / 900
                              </span>
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleCommentUpdate(comment.comment_seq)}
                                  className="text-[11px] text-gray-400 hover:text-indigo-900 font-bold transition-colors"
                                >
                                  완료
                                </button>
                                <button
                                  onClick={() => { setEditingCommentSeq(null); setEditingContent(''); }}
                                  className="text-[11px] text-gray-400 hover:text-gray-600 font-bold transition-colors"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p>{comment.content}</p>
                            {String(comment.users_id) === String(user?.id) && (
                              <div className="flex items-center gap-3 mt-2 justify-end">
                                <button 
                                  onClick={() => {
                                    setEditingCommentSeq(comment.comment_seq);
                                    setEditingContent(comment.content);
                                  }}
                                className="text-[11px] text-gray-400 hover:text-indigo-600 font-bold transition-colors">
                                  수정
                                </button>
                                <button 
                                  onClick={() => handleCommentDelete(comment.comment_seq)}
                                  className="text-[11px] text-gray-400 hover:text-rose-500 font-bold transition-colors"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm text-gray-400">등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
                </div>
              )}
            </div>

            {/* 댓글 입력창 */}
            <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm">
              {/* 프로필 + 이름 상단 배치 */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                  {user?.sysname ? (
                    <img
                      src={`http://localhost/file/profile/view?sysname=${user.sysname}&token=${token}`}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-600 font-bold text-sm bg-indigo-50">
                      {user?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-gray-700">{user?.name}</span>
              </div>

              {/* 입력창 전체 너비 */}
              <div
                className="bg-white rounded-2xl border transition-all overflow-hidden"
                style={{
                  boxShadow: isFocused ? '0 0 0 2px #DDE8FF' : 'none',
                  borderColor: isFocused ? '#DDE8FF' : '#E2E8F0'
                }}
              >
                <style>{`
                  .comment-textarea:focus {
                    border-color: transparent !important;
                    box-shadow: none !important;
                    outline: none !important;
                  }
                `}</style>
                <textarea
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="댓글을 남겨주세요."
                  className="comment-textarea outline-none w-full bg-transparent border-0 focus:outline-none ring-0 focus:ring-0 text-sm text-gray-700 placeholder-gray-400 resize-none min-h-[120px] p-4 custom-scrollbar transition-all"
                  value={commentInput}
                  onChange={(e) => {
                    if ([...e.target.value].length <= 900) {
                      setCommentInput(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-[11px] font-bold ${[...commentInput].length >= 899 ? 'text-rose-500' : 'text-gray-400'}`}>
                  {[...commentInput].length} / 900
                </span>
                <button
                  onClick={handleCommentSubmit}
                  disabled={!commentInput.trim()}
                  className={`px-6 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm border ${
                    commentInput.trim()
                      ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 active:scale-95 cursor-pointer shadow-indigo-100'
                      : 'bg-white text-indigo-200 border-indigo-100 cursor-not-allowed'
                  }`}
                >
                  등록하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="px-4 md:px-8 py-4 md:py-5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-2 md:gap-3">
          <button
            onClick={() => navigate('/board')}
            className="px-4 md:px-8 py-2.5 md:py-3 bg-white border border-gray-200 text-gray-500 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-[#F0F4FF] hover:text-indigo-600 transition-all shadow-sm"
          >
            목록
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            {isAuthor && (
              <>
                <button
                  onClick={handleEdit}
                  className="px-4 md:px-8 py-2.5 md:py-3 bg-white border border-indigo-200 text-indigo-600 text-xs md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-indigo-50 transition-all shadow-sm"
                >
                  수정
                </button>
                
                <button
                  onClick={handleDelete}
                  className="px-4 md:px-8 py-2.5 md:py-3 bg-rose-500 text-white text-xs md:text-sm font-bold rounded-xl md:rounded-2xl hover:bg-rose-600 active:scale-[0.98] transition-all shadow-md shadow-rose-100"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BoardDetail;
