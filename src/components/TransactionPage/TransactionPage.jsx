import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Card, Nav, Form, Modal, Dropdown } from "react-bootstrap";
import dayjs from "dayjs";
import { db } from "../../firebase";
import { collection, query, where, getDocs, orderBy, doc, writeBatch, getDoc } from "firebase/firestore";
import { FaUniversity } from "react-icons/fa";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  RiWalletLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiCalendarLine,
  RiSearchLine,
} from "react-icons/ri";
import Pagination from "../Pagination/Pagination";
import AppButton from "../ui/AppButton";
import AppLoader from "../ui/AppLoader";
import TableRowActionsDropdown from "../ui/TableRowActionsDropdown";
import { useAppToast } from "../ui/AppToastProvider";
import TransactionModal from "../TransactionModal/TransactionModal";
import { formatExpenseRangeLabelDisplay } from "../../utils/expenseRange";

const TransactionMonthlyCompareChart = lazy(() => import("./TransactionMonthlyCompareChart"));

const ITEMS_PER_PAGE = 100;

const CATEGORY_BADGE_TONE_COUNT = 8;

const getCategoryBadgeTone = (category) => {
  const key = String(category ?? "Other");
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = Math.imul(31, h) + key.charCodeAt(i) | 0;
  }
  return Math.abs(h) % CATEGORY_BADGE_TONE_COUNT;
};

const formatDateShort = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const TransactionPage = ({
  rangeStart,
  rangeEnd,
  refreshKey,
  isAdmin = false,
  canPickTransactionDate = true,
}) => {
  const { showToast } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [activeType, setActiveType] = useState("expenses");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [editItem, setEditItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [descriptionPreview, setDescriptionPreview] = useState({ show: false, text: "" });
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [rangeStart, rangeEnd, refreshKey]);

  useEffect(() => {
    setSelectedItems(new Set());
    setSelectAll(false);
  }, [activeType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startDate = rangeStart;
      const endDate = rangeEnd;
      // Fetch expense data
      const expenseRef = collection(db, "expenses");
      const expenseQuery = query(
        expenseRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
      // Fetch income data
      const incomeRef = collection(db, "income");
      const incomeQuery = query(
        incomeRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
      );
      const [expenseSnapshot, incomeSnapshot] = await Promise.all([
        getDocs(expenseQuery),
        getDocs(incomeQuery)
      ]);
      const expenseData = expenseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const incomeData = incomeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setExpenseData(expenseData);
      setIncomeData(incomeData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Multiple selection functionality
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(paginatedData.map(item => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (itemId, checked) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
    
    // Update select all checkbox
    if (newSelectedItems.size === paginatedData.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedItems.size > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async () => {
    try {
      const batch = writeBatch(db);
      const collectionName = activeType === "expenses" ? "expenses" : "income";

      for (const itemId of selectedItems) {
        const docRef = doc(db, collectionName, itemId);
        if (collectionName === "expenses") {
          const snap = await getDoc(docRef);
          const row = snap.data();
          if (row?.cashTransactionId) {
            batch.delete(doc(db, "cash_transactions", row.cashTransactionId));
          }
        }
        batch.delete(docRef);
      }
      
      await batch.commit();
      
      showToast({
        message: `${selectedItems.size} transaction(s) deleted successfully!`,
        variant: "success",
      });
      setShowBulkDeleteModal(false);
      setSelectedItems(new Set());
      setSelectAll(false);
      fetchData();
    } catch (error) {
      console.error("Error deleting transactions:", error);
      showToast({
        message: "Error deleting transactions. Please try again.",
        variant: "error",
      });
    }
  };

  const handleEdit = (item) => {
    setEditItem({
      ...item,
      transactionType: activeType === "income" ? "income" : "expense",
    });
  };

  const handleEditSuccess = () => {
    setEditItem(null);
    showToast({ message: "Transaction updated successfully!", variant: "success" });
    fetchData();
  };

  const handleDelete = (item) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const collectionName = activeType === "expenses" ? "expenses" : "income";
      const docRef = doc(db, collectionName, deleteItem.id);
      const batch = writeBatch(db);
      if (collectionName === "expenses" && deleteItem.cashTransactionId) {
        batch.delete(doc(db, "cash_transactions", deleteItem.cashTransactionId));
      }
      batch.delete(docRef);
      await batch.commit();

      showToast({ message: "Transaction deleted successfully!", variant: "success" });
      setShowDeleteModal(false);
      setDeleteItem(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showToast({
        message: "Error deleting transaction. Please try again.",
        variant: "error",
      });
    }
  };

  // Search and pagination
  const data = activeType === "expenses" ? expenseData : incomeData;

  const categoryFilterOptions = useMemo(() => {
    const set = new Set();
    const src = activeType === "expenses" ? expenseData : incomeData;
    src.forEach((row) => set.add(row.category || "Other"));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activeType, expenseData, incomeData]);

  const monthlyCompareData = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    try {
      const start = dayjs(rangeStart).startOf("month");
      const endMonth = dayjs(rangeEnd).startOf("month");
      if (!start.isValid() || !endMonth.isValid() || start.isAfter(endMonth)) return [];
      const months = [];
      for (let cursor = start; !cursor.isAfter(endMonth); cursor = cursor.add(1, "month")) {
        months.push(cursor);
      }
      const matchesCategory = (row) =>
        !categoryFilter || (row.category || "Other") === categoryFilter;
      return months.map((m) => {
        const ym = m.format("YYYY-MM");
        const label = m.format("MMM YYYY");
        const inMonth = (row) => {
          const d = String(row.date || "").slice(0, 10);
          if (!d || d.length < 7) return false;
          return d.slice(0, 7) === ym;
        };
        const income = incomeData
          .filter(inMonth)
          .filter(matchesCategory)
          .reduce((s, row) => s + Number(row.amount || 0), 0);
        const expense = expenseData
          .filter(inMonth)
          .filter(matchesCategory)
          .reduce((s, row) => s + Number(row.amount || 0), 0);
        return { month: label, monthKey: ym, income, expense };
      });
    } catch {
      return [];
    }
  }, [rangeStart, rangeEnd, incomeData, expenseData, categoryFilter]);

  const filteredData = useMemo(() => {
    let rows = data;
    if (categoryFilter) {
      rows = rows.filter((row) => (row.category || "Other") === categoryFilter);
    }
    if (!searchTerm) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((value) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(q);
      })
    );
  }, [data, categoryFilter, searchTerm]);

  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const offset = currentPage * ITEMS_PER_PAGE;
  const paginatedData = useMemo(() => {
    return filteredData.slice(offset, offset + ITEMS_PER_PAGE);
  }, [filteredData, offset]);

  const showRowSelect = isAdmin && paginatedData.length > 1;

  useEffect(() => {
    if (!showRowSelect) {
      setSelectedItems(new Set());
      setSelectAll(false);
    }
  }, [showRowSelect]);

  if (loading) {
    return (
      <div className="app-card-loader">
        <AppLoader message="Loading transactions..." variant="inline" />
      </div>
    );
  }

  return (
    <div className="transaction-page">
      <Card>
        <Card.Header className="transaction-card-header">
          <div className="transaction-card-header__copy">
            <p className="transaction-card-header__eyebrow">Ledger</p>
            <h5 className="transaction-card-header__title">Transactions</h5>
          </div>
          <div className="transaction-card-header__range" title={formatExpenseRangeLabelDisplay(rangeStart, rangeEnd)}>
            <RiCalendarLine aria-hidden="true" />
            <span>{formatExpenseRangeLabelDisplay(rangeStart, rangeEnd)}</span>
          </div>
        </Card.Header>
        <Card.Body>
      <Suspense fallback={null}>
        <TransactionMonthlyCompareChart data={monthlyCompareData} categoryFilter={categoryFilter} />
      </Suspense>

      <div className="transaction-toolbar">
        <div className="transaction-toolbar__primary">
          <Nav className="transaction-type-nav" role="tablist" aria-label="Transaction type">
            <Nav.Item>
              <Nav.Link
                active={activeType === "expenses"}
                className="transaction-type-nav__link transaction-type-nav__link--expense"
                onClick={() => {
                  setActiveType("expenses");
                  setCurrentPage(0);
                  setSelectedItems(new Set());
                  setSelectAll(false);
                }}
              >
                <RiArrowDownLine className="transaction-type-nav-icon" aria-hidden />
                <span>Expenses</span>
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={activeType === "income"}
                className="transaction-type-nav__link transaction-type-nav__link--income"
                onClick={() => {
                  setActiveType("income");
                  setCurrentPage(0);
                  setSelectedItems(new Set());
                  setSelectAll(false);
                }}
              >
                <RiArrowUpLine className="transaction-type-nav-icon" aria-hidden />
                <span>Income</span>
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <div className="transaction-search">
            <span className="transaction-search__icon" aria-hidden="true">
              <RiSearchLine />
            </span>
            <input
              id="transactions-search"
              type="search"
              name="transactions-search"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="transaction-search__input"
              aria-label="Search transactions"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="transaction-toolbar__secondary">
          <Form.Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="transaction-category-select"
            size="sm"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categoryFilterOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {showRowSelect && selectedItems.size > 0 ? (
        <div className="transaction-select-bar">
          <span className="transaction-select-bar__count">
            {selectedItems.size} selected
          </span>
          <AppButton tone="danger" size="xs" onClick={handleBulkDelete}>
            <FiTrash2 aria-hidden="true" />
            Delete
          </AppButton>
        </div>
      ) : null}

      <div className="app-data-table-wrap">
        <table className="app-data-table">
          <thead>
            <tr>
              {showRowSelect && (
                <th className="transaction-col-check" scope="col">
                  <input
                    type="checkbox"
                    className="transaction-check"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              <th className="px-4 py-3 border-b border-border text-left font-bold">Date</th>
              <th className="px-4 py-3 border-b border-border text-left font-bold">Amount</th>
              <th className="px-4 py-3 border-b border-border text-left font-bold">Description</th>
              <th className="px-4 py-3 border-b border-border text-left font-bold">Category</th>
              {activeType === "income" && <th className="px-4 py-3 border-b border-border text-left font-bold">Source</th>}
              {isAdmin && (
                <th className="px-4 py-3 border-b border-border font-bold text-right app-data-table__actions">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr key={row.id} className={`hover:bg-raised transition-colors duration-150 ${selectedItems.has(row.id) ? 'selected-row' : ''}`}>
                {showRowSelect && (
                  <td className="transaction-col-check">
                    <input
                      type="checkbox"
                      className="transaction-check"
                      checked={selectedItems.has(row.id)}
                      onChange={(e) => handleSelectItem(row.id, e.target.checked)}
                      aria-label={`Select transaction ${row.id}`}
                    />
                  </td>
                )}
                <td className="px-4 py-2 border-b border-border">
                  {formatDateShort(row.date)}
                </td>
                <td className="px-4 py-2 border-b border-border">
                  <span
                    className={`transaction-amount ${
                      activeType === "expenses" ? "transaction-amount--expense" : "transaction-amount--income"
                    }`}
                  >
                    {activeType === "expenses" ? (
                      row.paymentSource === "cash" ? (
                        <RiWalletLine className="transaction-amount-source-icon" title="Cash" aria-hidden />
                      ) : (
                        <FaUniversity className="transaction-amount-source-icon" title="Bank" aria-hidden />
                      )
                    ) : row.source === "Cash" ? (
                      <RiWalletLine className="transaction-amount-source-icon" title="Cash" aria-hidden />
                    ) : row.source === "Online Payment" ? (
                      <FaUniversity className="transaction-amount-source-icon" title="Bank" aria-hidden />
                    ) : null}
                    <span className="transaction-amount__value">
                      {Number(row.amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2 border-b border-border transaction-desc-cell">
                  <span
                    className="transaction-desc-text"
                    role={row.description ? "button" : undefined}
                    tabIndex={row.description ? 0 : undefined}
                    title={row.description ? "Click to view full description" : undefined}
                    onClick={() => {
                      const t = row.description != null ? String(row.description).trim() : "";
                      if (t) setDescriptionPreview({ show: true, text: row.description != null ? String(row.description) : "" });
                    }}
                    onKeyDown={(e) => {
                      if (!row.description) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        const t = row.description != null ? String(row.description) : "";
                        if (t) setDescriptionPreview({ show: true, text: t });
                      }
                    }}
                  >
                    {row.description}
                  </span>
                </td>
                <td className="px-4 py-2 border-b border-border transaction-category-cell">
                  <span
                    className={`transaction-category-badge transaction-category-badge--tone-${getCategoryBadgeTone(row.category)}`}
                  >
                    {row.category}
                  </span>
                </td>
                {activeType === "income" && (
                  <td className="px-4 py-2 border-b border-border">
                    {row.source}
                  </td>
                )}
                {isAdmin && (
                  <td className="px-4 py-2 border-b border-border text-right app-data-table__actions">
                    <TableRowActionsDropdown id={`transaction-actions-${row.id}`}>
                      <Dropdown.Item onClick={() => handleEdit(row)}>
                        <FiEdit2 className="me-2" /> Edit
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => handleDelete(row)} className="table-row-actions-delete">
                        <FiTrash2 className="me-2" /> Delete
                      </Dropdown.Item>
                    </TableRowActionsDropdown>
                  </td>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td
                  colSpan={
                    (activeType === "income" ? 5 : 4) +
                    (isAdmin ? 1 : 0) +
                    (showRowSelect ? 1 : 0)
                  }
                  className="text-center py-4 text-muted"
                >
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 d-flex justify-content-center">
          <Pagination
            pageCount={pageCount}
            onPageChange={({ selected }) => setCurrentPage(selected)}
            forcePage={currentPage}
          />
        </div>
      )}

      <Modal
        show={descriptionPreview.show}
        onHide={() => setDescriptionPreview({ show: false, text: "" })}
        centered
        className="app-modal transaction-modal transaction-desc-preview-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="fw-semibold fs-6">Description</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4 pb-4">
          <p className="transaction-desc-full mb-0">{descriptionPreview.text || "—"}</p>
        </Modal.Body>
        <Modal.Footer>
          <AppButton
            tone="secondary"
            size="sm"
            onClick={() => setDescriptionPreview({ show: false, text: "" })}
          >
            Close
          </AppButton>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered className="app-modal app-modal--danger">
        <Modal.Header closeButton>
          <Modal.Title>Delete transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="app-modal__lead">This will permanently remove the entry from your ledger.</p>
          <div className="app-modal__detail">
            <div className="app-modal__detail-row">
              <span className="app-modal__detail-label">Amount</span>
              <span className="app-modal__detail-value">
                {deleteItem?.amount != null
                  ? Number(deleteItem.amount).toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : "—"}
              </span>
            </div>
            <div className="app-modal__detail-row">
              <span className="app-modal__detail-label">Description</span>
              <span className="app-modal__detail-value">{deleteItem?.description || "—"}</span>
            </div>
            <div className="app-modal__detail-row">
              <span className="app-modal__detail-label">Category</span>
              <span className="app-modal__detail-value">{deleteItem?.category || "—"}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <AppButton tone="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </AppButton>
          <AppButton tone="danger" size="sm" onClick={confirmDelete}>
            Delete
          </AppButton>
        </Modal.Footer>
      </Modal>

      <Modal show={showBulkDeleteModal} onHide={() => setShowBulkDeleteModal(false)} centered className="app-modal app-modal--danger">
        <Modal.Header closeButton>
          <Modal.Title>Delete selected</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="app-modal__lead">
            Permanently delete <strong>{selectedItems.size}</strong> selected transaction
            {selectedItems.size === 1 ? "" : "s"}? This can’t be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <AppButton tone="ghost" size="sm" onClick={() => setShowBulkDeleteModal(false)}>
            Cancel
          </AppButton>
          <AppButton tone="danger" size="sm" onClick={confirmBulkDelete}>
            Delete {selectedItems.size}
          </AppButton>
        </Modal.Footer>
      </Modal>

      <TransactionModal
        show={Boolean(editItem)}
        editItem={editItem}
        handleClose={() => setEditItem(null)}
        onSuccess={handleEditSuccess}
        canPickTransactionDate={canPickTransactionDate}
      />
        </Card.Body>
      </Card>
    </div>
  );
};

export default TransactionPage;
