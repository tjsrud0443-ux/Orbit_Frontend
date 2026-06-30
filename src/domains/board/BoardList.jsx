import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import MobilePagination from '../../components/common/MobilePagination';
import { maxios } from "../../api/axiosConfig"; 
import { getBoardList } from './boardApi';
import useLoadingStore from '../../store/useLoadingStore';
import { alertSuccess, alertError } from '../../utils/alert';

const ITEMS_PER_PAGE = 10;

const getCategoryStyle = (category) => {
  // 💡 category가 없을 때를 대비한 방어 코드 및 앞뒤 공백 제거(.trim())
  const cleanCategory = category ? category.trim() : '';

  switch (cleanCategory) {
    case '공지': 
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case '경조': 
      return 'bg-sky-50 text-sky-600 border-sky-100';
    case '생일': 
      return 'bg-violet-50 text-violet-600 border-violet-100';
    case '승진': 
      return 'bg-amber-50 text-amber-600 border-amber-100';
    // 💡 공백이 있든('부서 이동') 없든('부서이동') 둘 다 에메랄드 색상으로 처리
    case '부서 이동':
    case '부서이동': 
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    default: 
      // 매칭 안 되면 투명하고 흐릿한 회색 뱃지가 됨 (현재 공지 글이 빠진 함정)
      return 'bg-gray-50 text-gray-500 border-gray-100';
  }
};

const CategoryTag = ({ label }) => {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryStyle(label)}`}>
      {label}
    </span>
  );
};

const PostRow = ({ post, total, onLike, onClick }) => {
 return ( 
  <div 
    onClick={onClick}
    className="relative flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 px-6 md:px-8 py-4 items-start md:items-center cursor-pointer hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0"
  >
    {/* 번호 - 데스크톱 전용 */}
    <div className="hidden md:block md:col-span-1 text-center">
      {['공지', '경조', '생일', '승진', '부서 이동'].includes(post.category?.trim())
        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">공지</span>
        : <span className="text-xs text-gray-400">{total - post.row_rank + 1}</span>
      }
    </div>

    {/* 제목 & 모바일용 서브 정보 */}
    <div className="col-span-12 md:col-span-4 flex flex-col gap-1 min-w-0 w-full pr-16 md:pr-0">
      <div className="flex items-center gap-2">
        {['공지', '경조', '생일', '승진', '부서 이동'].includes(post.category?.trim()) && (
          <span className="md:hidden text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0">공지</span>
        )}
        <span 
          className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors truncate"
          title={post.title}
        >
          {post.title}
        </span>
        {post.isNew && (
          <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">N</span>
        )}
      </div>
      {/* 모바일에서만 보이는 작성자/작성일 */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="text-[11px] text-gray-500 font-medium">{post.author_name}</span>
        <span className="text-[11px] text-gray-300">|</span>
        <span className="text-[11px] text-gray-400">{post.created_at.slice(0, 10)}</span>
      </div>
    </div>

    {/* 카테고리 */}
    <div className="col-span-6 md:col-span-2 mt-1 md:mt-0">
      <CategoryTag label={post.category} />
    </div>

    {/* 작성자 - 데스크톱 */}
    <div className="hidden md:block md:col-span-2 text-xs text-gray-500 font-medium">{post.author_name}</div>

    {/* 작성일 - 데스크톱 */}
    <div className="hidden md:block md:col-span-2 text-xs text-gray-400 text-center">{post.created_at.slice(0, 10)}</div>

    {/* 조회 - 데스크톱/모바일 공통 (모바일은 우측 상단이나 하단 배치 고민 가능하나 일단 유지) */}
    <div className="absolute right-4 top-5 md:static md:col-span-1 flex items-center justify-center">
      <span className="flex items-center gap-1 text-[11px] text-gray-400">
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        {post.view_count}
      </span>
    </div>
  </div>
);
}
const BoardList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nav = () => {
    navigate('/BoardWrite');
  }

  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState([]);
  const [noticePosts, setNoticePosts] = useState([]);
  const [page, setPage] = useState(location.state?.page || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAll, setTotalAll] = useState(0);

  const { showLoading, hideLoading } = useLoadingStore();
  const isFirstLoad = useRef(true);
    // API 호출
  useEffect(() => {
    if (isFirstLoad.current) {
      showLoading();
      isFirstLoad.current = false;
    }
    const timer = setTimeout(() => {
      getBoardList({page, size:10, keyword:search}).then(resp=>{
        setTotalAll(resp.data.totalAll);
        setPosts(resp.data.list);
        setNoticePosts(resp.data.noticeList || []);
        setTotalPages(resp.data.totalPages);
        setTotal(resp.data.total);
      }).catch(err => {
        console.error('게시글 목록 조회 실패', err);
      }).finally(() => {
        hideLoading();
        if (location.state?.alert) {
          const { type, title, text } = location.state.alert;
          if (type === 'success') {
            alertSuccess(title, text);
          } else if (type === 'error') {
            alertError(title, text);
          }
          navigate(location.pathname, { replace: true, state: { page } });
        }
      });
    }, 300);
    
    return () => clearTimeout(timer);
    }, [page, search]); // page나 search 바뀔 때마다 재호출

  // 검색어 바뀌면 1페이지로 초기화
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };
  const handleLike = (idx) => {
    setPosts(prev => prev.map((p, i) =>
      i !== idx ? p : { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
    ));
  };

  return (
    <div className="w-full h-screen lg:h-full flex flex-col p-6 md:p-8 lg:px-10 box-border bg-white font-sans">

      {/* 페이지 헤더 */}
      <div className="mb-4 flex justify-between items-start shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">사내 게시판</h1>
          <p className="text-[0.85rem] text-gray-500 font-medium mb-3">공지사항, 이벤트, 게시글을 확인하세요</p>
        </div>
        <div className="flex flex-col items-end">
          <button 
            className="md:hidden bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 text-xl font-bold"
            onClick={nav}
          >
            +
          </button>
          <button className="hidden md:block bg-indigo-600 text-white text-[0.75rem] font-bold 
          px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 mt-4 mb-1"
          onClick={nav}>
            + 글쓰기
          </button>
        </div>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-0 ">

        {/* 툴바 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:px-8 border-b border-gray-50 bg-white shrink-0 rounded-t-3xl">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-s font-extrabold text-indigo-950">게시글 목록</h3>
            <span className="bg-indigo-50 text-indigo-600 text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
              총 {totalAll}건
            </span>
          </div>

          {/* 검색창 — 회의록과 동일한 스타일 */}
          <div className="relative group w-full md:w-64">
            <input
              type="text"
              placeholder="제목, 작성자로 검색"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl
                focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 outline-none
                transition-all placeholder:text-gray-300 text-xs text-gray-700 shadow-sm"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 테이블 헤더 — 데스크톱만 */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="col-span-1 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">번호</div>
          <div className="col-span-4 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">제목</div>
          <div className="col-span-2 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">카테고리</div>
          <div className="col-span-2 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">작성자</div>
          <div className="col-span-2 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">작성일</div>
          <div className="col-span-1 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider text-center">조회수</div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
          `}</style>
           {/* 공지 고정 영역 */}
          {noticePosts.map((post, i) => (
            <PostRow
              key={`notice-${post.post_seq}`}
              post={post}
              total={totalAll}
              onClick={() => navigate(`/boardDetail/${post.post_seq}`, { state: { page } })}
            />
          ))}
           {/* 일반 게시글 */}
          {posts.length > 0 ? (
            posts.map((post, i) => {
              return (
              <PostRow 
                key={post.post_seq || i} 
                post={post} 
                total={totalAll}
                onLike={() => handleLike(posts.indexOf(post))} 
                onClick={() => navigate(`/boardDetail/${post.post_seq}`, { state: { page } })}
              />
            )})
          ) : (
          noticePosts.length === 0 && (
            <div className="py-20 text-center text-gray-400 text-sm font-bold">게시글이 없습니다.</div>
          )
        )}
        </div>

        {/* 페이지네이션 */}
        <div className="border-t border-gray-50 bg-white py-2 shrink-0 rounded-b-3xl">
          <MobilePagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
          <div className="hidden md:block">
            <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoardList;
