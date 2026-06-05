import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';

const CATEGORIES = ['전체', '공지', '이벤트', '인사/총무', '자유', '프로젝트'];

const ITEMS_PER_PAGE = 10;

const CategoryTag = ({ label }) => {
  return (
    <span className="bg-gray-50 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-100">
      {label}
    </span>
  );
};

const POSTS = [
  { id: '공지', title: '[필독] 2026년 하반기 보안 정책 업데이트 안내', isNew: true,  category: '공지',     author: '정선경', date: '2026-06-03', views: 312, likes: 18, liked: false },
  { id: '공지', title: '6월 전사 워크숍 참가 신청 안내',               isNew: true,  category: '이벤트',   author: '김민지', date: '2026-06-02', views: 204, likes: 31, liked: false },
  { id: '23',   title: '7월 급여 지급일 및 복리후생 변경 사항 안내',   isNew: false, category: '인사/총무', author: '이하준', date: '2026-05-30', views: 177, likes: 8,  liked: false },
  { id: '22',   title: '사무실 냉난방 사용 규칙 공유합니다',           isNew: false, category: '자유',     author: '박소연', date: '2026-05-28', views: 98,  likes: 14, liked: true  },
  { id: '21',   title: '2차 스프린트 기능 통합 완료 공유',             isNew: false, category: '프로젝트', author: '최우진', date: '2026-05-25', views: 145, likes: 22, liked: false },
  { id: '20',   title: '구내식당 메뉴 개선 의견 수렴합니다',           isNew: false, category: '자유',     author: '강다은', date: '2026-05-22', views: 201, likes: 41, liked: true  },
  { id: '19',   title: '사내 도서 대여 시스템 오픈 안내',             isNew: false, category: '공지',     author: '정선경', date: '2026-05-20', views: 88,  likes: 6,  liked: false },
  { id: '18',   title: '신규 입사자 OJT 프로그램 일정 공지',          isNew: false, category: '인사/총무', author: '이하준', date: '2026-05-18', views: 134, likes: 9,  liked: false },
];

const PostRow = ({ post, onLike }) => (
  <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-gray-50 transition-colors group border-b border-gray-50 last:border-0">
    {/* 번호 */}
    <div className="col-span-1">
      {post.id === '공지'
        ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">공지</span>
        : <span className="text-xs text-gray-400">{post.id}</span>
      }
    </div>

    {/* 제목 */}
    <div className="col-span-5 flex items-center gap-2 min-w-0">
      <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors truncate">
        {post.title}
      </span>
      {post.isNew && (
        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">N</span>
      )}
    </div>

    {/* 카테고리 */}
    <div className="col-span-2">
      <CategoryTag label={post.category} />
    </div>

    {/* 작성자 */}
    <div className="col-span-2 text-xs text-gray-500 font-medium">{post.author}</div>

    {/* 작성일 */}
    <div className="col-span-1 text-xs text-gray-400">{post.date}</div>

    {/* 조회 */}
    <div className="col-span-1 flex items-center justify-center">
      <span className="flex items-center gap-1 text-[11px] text-gray-400">
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
        </svg>
        {post.views}
      </span>
    </div>
  </div>
);

const BoardList = () => {
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState(POSTS);
  const [page, setPage] = useState(1);

  const navigate = useNavigate();
  const nav = () => {
    navigate('/BoardWrite');
  }
  const filtered = posts.filter(p =>
    p.title.includes(search) || p.author.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleLike = (idx) => {
    setPosts(prev => prev.map((p, i) =>
      i !== idx ? p : { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
    ));
  };

  return (
    <div className="w-full h-screen lg:h-full flex flex-col p-6 md:p-8 lg:px-10 box-border bg-white font-sans">

      {/* 페이지 헤더 */}
      <div className="mb-4 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">사내 게시판</h1>
          <p className="text-[0.85rem] text-gray-500 font-medium mb-3">공지사항, 이벤트, 게시글을 확인하세요</p>
        </div>
        <button className="hidden md:block bg-indigo-600 text-white text-[0.75rem] font-bold 
        px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 mb-1"
        onClick={nav}>
          + 글쓰기
        </button>
      </div>

      {/* 모바일 글쓰기 버튼 */}
      <div className="md:hidden flex justify-end mb-4">
        <button className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 text-xl font-bold">
          +
        </button>
      </div>

      {/* 카드 */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* 툴바 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 md:px-8 border-b border-gray-50 bg-white shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-s font-extrabold text-indigo-950">게시글 목록</h3>
            <span className="bg-indigo-50 text-indigo-600 text-[0.7rem] font-bold px-2.5 py-1 rounded-full">
              총 {filtered.length}건
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
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="col-span-1 ml-5 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">번호</div>
          <div className="col-span-5 ml-3 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">제목</div>
          <div className="col-span-2 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">카테고리</div>
          <div className="col-span-2  text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">작성자</div>
          <div className="col-span-1 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">작성일</div>
          <div className="col-span-1 text-[0.7rem] font-extrabold text-gray-400 uppercase tracking-wider">조회수</div>
        </div>

        {/* 목록 */}
        <div className="divide-y divide-gray-50 px-4 md:px-4">
          {paginated.length > 0 ? (
            paginated.map((post, i) => (
              <PostRow key={i} post={post} onLike={() => handleLike(posts.indexOf(post))} />
            ))
          ) : (
            <div className="py-20 text-center text-gray-400 text-sm font-bold">게시글이 없습니다.</div>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="border-t border-gray-50 bg-white py-2 shrink-0">
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
        </div>
      </div>
    </div>
  );
};

export default BoardList;