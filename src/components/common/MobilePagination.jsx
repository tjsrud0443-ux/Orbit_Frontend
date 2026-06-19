import React from 'react';

const MobilePagination = ({ count, page, onChange }) => {
  const maxVisiblePages = 5;
  const pageCount = Math.max(1, count);
  const startPage = Math.max(1, Math.min(page - 2, pageCount - maxVisiblePages + 1));
  const endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);
  const pageNumbers = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);

  return (
    <div className="md:hidden flex items-center justify-center gap-1 py-3">
      <button
        type="button"
        onClick={(event) => onChange(event, Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 disabled:text-gray-300 disabled:bg-gray-50"
      >
        &lt;
      </button>
      {pageNumbers.map(pageNumber => (
        <button
          type="button"
          key={pageNumber}
          onClick={(event) => onChange(event, pageNumber)}
          className={`w-8 h-8 rounded-lg border text-xs font-bold ${
            page === pageNumber
              ? 'bg-[#3530B8] text-white border-[#3530B8]'
              : 'bg-white text-gray-500 border-gray-200'
          }`}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        onClick={(event) => onChange(event, Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="w-8 h-8 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 disabled:text-gray-300 disabled:bg-gray-50"
      >
        &gt;
      </button>
    </div>
  );
};

export default MobilePagination;
