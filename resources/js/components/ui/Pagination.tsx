import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, lastPage, onPageChange }: PaginationProps) {
  if (lastPage <= 1) return null;

  const pages = buildPageNumbers(currentPage, lastPage);

  return (
    <nav className="flex justify-center items-center gap-1" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
      </Button>

      <div className="flex items-center gap-1 mx-1">
        {pages.map((entry, i) =>
          entry === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground select-none">
              &hellip;
            </span>
          ) : (
            <Button
              key={entry}
              variant={entry === currentPage ? "default" : "outline"}
              size="sm"
              className="w-9 h-9 p-0"
              onClick={() => onPageChange(entry as number)}
              aria-current={entry === currentPage ? "page" : undefined}
            >
              {entry}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === lastPage}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
}

function buildPageNumbers(current: number, last: number): (number | "...")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const delta = 2;

  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(last - 1, current + delta);

  pages.push(1);

  if (rangeStart > 2) pages.push("...");

  for (let p = rangeStart; p <= rangeEnd; p++) {
    pages.push(p);
  }

  if (rangeEnd < last - 1) pages.push("...");

  pages.push(last);

  return pages;
}
