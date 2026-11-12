import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-2 border-t border-teal-500/25 ${className}`}>
      {/* Information text */}
      <div className="text-[11px] font-bold text-teal-200/70">
        Menampilkan <span className="font-black text-emerald-300">{startItem}</span> - <span className="font-black text-emerald-300">{endItem}</span> dari <span className="font-black text-white">{totalItems}</span> data
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-xl border border-teal-500/30 bg-[#042422] hover:bg-[#083834] text-teal-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs active:scale-95"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Square Number Buttons */}
        {pages.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span key={`ellipse-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs font-bold text-teal-300/50">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;

          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all shadow-xs active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 border border-emerald-300/40 shadow-emerald-500/20'
                  : 'bg-[#042422] hover:bg-[#083834] text-teal-200 border border-teal-500/30'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next button */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-xl border border-teal-500/30 bg-[#042422] hover:bg-[#083834] text-teal-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-xs active:scale-95"
          title="Halaman Berikutnya"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
