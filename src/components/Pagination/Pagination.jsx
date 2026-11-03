import React from "react";
import ReactPaginate from "react-paginate";

const Pagination = ({ pageCount, onPageChange, forcePage, currentPage }) => {
  const resolvedForcePage =
    typeof forcePage === "number"
      ? forcePage
      : typeof currentPage === "number"
        ? currentPage
        : undefined;

  return (
    <ReactPaginate
      previousLabel={"Previous"}
      nextLabel={"Next"}
      pageCount={pageCount}
      onPageChange={onPageChange}
      forcePage={resolvedForcePage}
      containerClassName={"pagination"}
      activeClassName={"active"}
    />
  );
};

export default Pagination;
