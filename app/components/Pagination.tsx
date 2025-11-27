"use client";

import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
}: PaginationProps) {

  const [inputValue, setInputValue] = useState("");

  let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  const end = Math.min(totalPages, start + maxVisiblePages - 1);

  if (end - start + 1 < maxVisiblePages) {
    start = Math.max(1, end - maxVisiblePages + 1);
  }

  const pages: number[] = [];
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();

    const pageNum = Number(inputValue);
    if (!pageNum || pageNum < 1 || pageNum > totalPages) return;

    onPageChange(pageNum);
    setInputValue("");
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8 select-none">
      {/* First page << */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(1)}
        className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
      >
        ≪
      </button>
      {/* Prev < */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
      >
        {"<"}
      </button>
      {/* Page num */}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 border rounded ${
            p === currentPage
              ? "bg-blue-600 text-white border-blue-600"
              : "hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}
      {/* Next > */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
      >
        {">"}
      </button>
      {/* Last >> */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(totalPages)}
        className="px-2 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
      >
        ≫
      </button>
      {/* Jump to page */}
      <form onSubmit={handleJump} className="inline-block">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Page"
          className="w-20 px-2 py-1 border rounded"
        />
      </form>
      <span className="text-sm text-gray-600">
        {currentPage} / {totalPages} pages
      </span>
    </div>
  );
}