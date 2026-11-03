import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Modal, Form, Row, Col, Dropdown } from "react-bootstrap";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  writeBatch,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { RiCalendarLine, RiSearchLine, RiArrowDownLine, RiArrowUpLine } from "react-icons/ri";
import TableRowActionsDropdown from "../ui/TableRowActionsDropdown";
import AppDatePicker from "../ui/AppDatePicker";
import AppButton from "../ui/AppButton";
import AppLoader from "../ui/AppLoader";
import ConfirmDeleteModal from "../ui/ConfirmDeleteModal";
import { useAppToast } from "../ui/AppToastProvider";
import { formatExpenseRangeLabelDisplay } from "../../utils/expenseRange";

const formatCashDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
};

const formatCashAmount = (amount) => {
  return parseFloat(amount || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
};

const getInitialCashFormData = () => ({
  date: new Date().toISOString().split("T")[0],
  particular: "",
  debit: "",
  credit: "",
  type: "credit",
});

const CashTransactionRow = ({ transaction, onEdit, onDelete }) => {
  return (
    <tr className="hover:bg-raised transition-colors duration-150">
      <td className="px-4 py-2 border-b border-border">{formatCashDate(transaction.date)}</td>
      <td className="px-4 py-2 border-b border-border cash-particular-cell">{transaction.particular}</td>
      <td className="px-4 py-2 border-b border-border">
        {transaction.debit > 0 ? (
          <span className="transaction-amount transaction-amount--expense">
            {formatCashAmount(transaction.debit)}
          </span>
        ) : (
          <span className="cash-dash">—</span>
        )}
      </td>
      <td className="px-4 py-2 border-b border-border">
        {transaction.credit > 0 ? (
          <span className="transaction-amount transaction-amount--income">
            {formatCashAmount(transaction.credit)}
          </span>
        ) : (
          <span className="cash-dash">—</span>
        )}
      </td>
      <td className="px-4 py-2 border-b border-border">
        <span
          className={`transaction-amount ${
            transaction.balance >= 0 ? "transaction-amount--income" : "transaction-amount--expense"
          }`}
        >
          {formatCashAmount(transaction.balance)}
        </span>
      </td>
      <td className="px-4 py-2 border-b border-border text-right app-data-table__actions">
        <TableRowActionsDropdown id={`cash-actions-${transaction.id}`}>
          <Dropdown.Item onClick={() => onEdit(transaction)}>
            <FiEdit2 className="me-2" /> Edit
          </Dropdown.Item>
          <Dropdown.Item onClick={() => onDelete(transaction)} className="table-row-actions-delete">
            <FiTrash2 className="me-2" /> Delete
          </Dropdown.Item>
        </TableRowActionsDropdown>
      </td>
    </tr>
  );
};

const CashTransactionModal = ({
  show,
  editingId,
  formData,
  errors,
  saving = false,
  onClose,
  onSubmit,
  onChange,
  onTypeChange,
}) => {
  return (
    <Modal
      show={show}
      onHide={saving ? undefined : onClose}
      centered
      size="lg"
      backdrop={saving ? "static" : true}
      keyboard={!saving}
      className="app-modal transaction-modal add-transaction-modal cash-transaction-modal"
    >
      <Modal.Header closeButton={!saving}>
        <Modal.Title>{editingId ? "Edit cash transaction" : "Add cash transaction"}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={`add-transaction-modal-body${saving ? " is-saving" : ""}`}>
        {saving ? (
          <div className="tx-modal-saving" role="status" aria-live="polite">
            <span className="tx-modal-saving__spinner" aria-hidden="true" />
            <span>Saving transaction…</span>
          </div>
        ) : null}
        <Form
          id="cash-transaction-form"
          onSubmit={onSubmit}
          className="add-transaction-modal-form"
          aria-busy={saving || undefined}
        >
          <fieldset disabled={saving} className="tx-modal-fieldset">
            <div className="tx-modal-type">
              <span className="tx-modal-type__label">Type</span>
              <div className="tx-modal-type__switch" role="group" aria-label="Cash transaction type">
                <button
                  type="button"
                  className={`tx-modal-type__btn tx-modal-type__btn--income${
                    formData.type === "credit" ? " is-active" : ""
                  }`}
                  onClick={() => onTypeChange({ target: { value: "credit" } })}
                >
                  <RiArrowUpLine aria-hidden="true" />
                  Cash in
                </button>
                <button
                  type="button"
                  className={`tx-modal-type__btn tx-modal-type__btn--expense${
                    formData.type === "debit" ? " is-active" : ""
                  }`}
                  onClick={() => onTypeChange({ target: { value: "debit" } })}
                >
                  <RiArrowDownLine aria-hidden="true" />
                  Expense
                </button>
              </div>
            </div>

            <Row className="g-3 add-transaction-modal-fields">
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Date</Form.Label>
                  <AppDatePicker
                    value={formData.date}
                    onChange={(v) => onChange({ target: { name: "date", value: v } })}
                    size="middle"
                    status={errors.date ? "error" : undefined}
                    allowClear={false}
                    className="tx-modal-datepicker"
                    disabled={saving}
                  />
                  {errors.date ? <div className="text-danger small mt-1">{errors.date}</div> : null}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>
                    {formData.type === "debit" ? "Expense amount (PKR)" : "Cash in (PKR)"}
                  </Form.Label>
                  {formData.type === "debit" ? (
                    <Form.Control
                      type="number"
                      name="debit"
                      value={formData.debit}
                      onChange={onChange}
                      isInvalid={!!errors.debit}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <Form.Control
                      type="number"
                      name="credit"
                      value={formData.credit}
                      onChange={onChange}
                      isInvalid={!!errors.credit}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                    />
                  )}
                  <Form.Control.Feedback type="invalid">
                    {formData.type === "debit" ? errors.debit : errors.credit}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group className="form-group">
                  <Form.Label>Particular</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="particular"
                    value={formData.particular}
                    onChange={onChange}
                    isInvalid={!!errors.particular}
                    rows={4}
                    placeholder="Enter transaction details…"
                  />
                  <Form.Control.Feedback type="invalid">{errors.particular}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </fieldset>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <AppButton type="button" tone="ghost" size="sm" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton
          type="submit"
          form="cash-transaction-form"
          tone="primary"
          size="sm"
          loading={saving}
          loadingText="Saving…"
        >
          {editingId ? "Save changes" : "Save transaction"}
        </AppButton>
      </Modal.Footer>
    </Modal>
  );
};

const CashInHandPage = ({ rangeStart, rangeEnd, refreshKey = 0, onDataChanged, addRequestKey = 0 }) => {
  const { showToast } = useAppToast();
  const [loading, setLoading] = useState(true);
  const [cashTransactions, setCashTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getInitialCashFormData());
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = rangeStart;
      const endDate = rangeEnd;

      const cashRef = collection(db, "cash_transactions");
      const cashQuery = query(
        cashRef,
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "asc")
      );

      const cashSnapshot = await getDocs(cashQuery);
      const transactions = cashSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      let balance = 0;
      const cashFlowData = transactions.map((transaction) => {
        if (transaction.type === "credit") {
          balance += parseFloat(transaction.credit || 0);
        } else {
          balance -= parseFloat(transaction.debit || 0);
        }

        return {
          ...transaction,
          balance,
        };
      });

      setCashTransactions([...cashFlowData].reverse());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleShowModal = () => {
    setFormData(getInitialCashFormData());
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  };

  const lastAddRequestKey = useRef(addRequestKey);
  useEffect(() => {
    if (addRequestKey === lastAddRequestKey.current) return;
    lastAddRequestKey.current = addRequestKey;
    if (!addRequestKey) return;
    handleShowModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open only on new header add clicks
  }, [addRequestKey]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setSaving(false);
    setFormData(getInitialCashFormData());
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCashTypeChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      type: value,
      debit: value === "debit" ? prev.debit : "",
      credit: value === "credit" ? prev.credit : "",
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.debit;
      delete next.credit;
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.particular?.trim()) newErrors.particular = "Particular is required";

    if (formData.type === "debit") {
      if (!formData.debit || isNaN(formData.debit) || parseFloat(formData.debit) <= 0) {
        newErrors.debit = "Valid debit amount is required";
      }
    } else if (!formData.credit || isNaN(formData.credit) || parseFloat(formData.credit) <= 0) {
      newErrors.credit = "Valid credit amount is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || saving) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);
      const transactionData = {
        date: formData.date,
        particular: formData.particular.trim(),
        type: formData.type,
        debit: formData.type === "debit" ? parseFloat(formData.debit) : 0,
        credit: formData.type === "credit" ? parseFloat(formData.credit) : 0,
        updatedAt: new Date().toISOString(),
      };

      if (editingId) {
        const cashRef = doc(db, "cash_transactions", editingId);
        const existingSnap = await getDoc(cashRef);
        const existing = existingSnap.exists() ? existingSnap.data() : null;
        const linkedExpenseId = existing?.linkedExpenseId || null;

        if (linkedExpenseId) {
          if (formData.type === "debit") {
            batch.update(doc(db, "expenses", linkedExpenseId), {
              date: transactionData.date,
              description: transactionData.particular,
              amount: transactionData.debit,
              paymentSource: "cash",
              cashTransactionId: editingId,
            });
          } else {
            batch.delete(doc(db, "expenses", linkedExpenseId));
            transactionData.linkedExpenseId = deleteField();
          }
        } else if (formData.type === "debit") {
          const expenseRef = doc(collection(db, "expenses"));
          batch.set(expenseRef, {
            date: transactionData.date,
            description: transactionData.particular,
            amount: transactionData.debit,
            category: "Cash Expense",
            paymentSource: "cash",
            cashTransactionId: editingId,
            type: "expense",
            createdAt: new Date().toISOString(),
          });
          transactionData.linkedExpenseId = expenseRef.id;
        }

        batch.update(cashRef, transactionData);
        await batch.commit();
        showToast({ message: "Transaction updated successfully!", variant: "success" });
      } else {
        transactionData.createdAt = new Date().toISOString();
        const cashRef = doc(collection(db, "cash_transactions"));
        if (formData.type === "debit") {
          const expenseRef = doc(collection(db, "expenses"));
          batch.set(expenseRef, {
            date: transactionData.date,
            description: transactionData.particular,
            amount: transactionData.debit,
            category: "Cash Expense",
            paymentSource: "cash",
            cashTransactionId: cashRef.id,
            type: "expense",
            createdAt: new Date().toISOString(),
          });
          transactionData.linkedExpenseId = expenseRef.id;
        }
        batch.set(cashRef, transactionData);
        await batch.commit();
        showToast({ message: "Transaction added successfully!", variant: "success" });
      }

      handleCloseModal();
      onDataChanged?.();
      await fetchData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      showToast({
        message: "Error saving transaction. Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    setFormData({
      date: transaction.date,
      particular: transaction.particular,
      debit: transaction.debit || "",
      credit: transaction.credit || "",
      type: transaction.type,
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (transaction) => {
    setDeleteItem(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const batch = writeBatch(db);
      const cashRef = doc(db, "cash_transactions", deleteItem.id);
      if (deleteItem.linkedExpenseId) {
        batch.delete(doc(db, "expenses", deleteItem.linkedExpenseId));
      }
      batch.delete(cashRef);
      await batch.commit();

      showToast({ message: "Transaction deleted successfully!", variant: "success" });
      setShowDeleteModal(false);
      setDeleteItem(null);
      onDataChanged?.();
      await fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showToast({
        message: "Error deleting transaction. Please try again.",
        variant: "error",
      });
    }
  };

  const filteredTransactions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cashTransactions;
    return cashTransactions.filter((t) =>
      String(t.particular || "")
        .toLowerCase()
        .includes(q)
    );
  }, [cashTransactions, searchTerm]);

  if (loading) {
    return (
      <div className="app-card-loader">
        <AppLoader message="Loading cash transactions…" variant="inline" />
      </div>
    );
  }

  const finalBalance = cashTransactions.length > 0 ? cashTransactions[0]?.balance || 0 : 0;

  return (
    <div className="cash-in-hand-page">
      <Card>
        <Card.Header className="transaction-card-header cash-card-header">
          <div className="transaction-card-header__copy">
            <p className="transaction-card-header__eyebrow">Cash book</p>
            <h5 className="transaction-card-header__title">Cash in hand</h5>
          </div>
          <div
            className="transaction-card-header__range"
            title={formatExpenseRangeLabelDisplay(rangeStart, rangeEnd)}
          >
            <RiCalendarLine aria-hidden="true" />
            <span>{formatExpenseRangeLabelDisplay(rangeStart, rangeEnd)}</span>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="cash-toolbar">
            <div className="cash-balance-chip">
              <span className="cash-balance-chip__label">Final balance</span>
              <span
                className={`cash-balance-chip__value ${
                  finalBalance >= 0 ? "is-positive" : "is-negative"
                }`}
              >
                Rs. {formatCashAmount(finalBalance)}
              </span>
            </div>

            <div className="transaction-search">
              <span className="transaction-search__icon" aria-hidden="true">
                <RiSearchLine />
              </span>
              <input
                id="cash-search"
                type="search"
                name="cash-search"
                placeholder="Search particular…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="transaction-search__input"
                aria-label="Search cash transactions"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="app-data-table-wrap">
            <table className="app-data-table">
              <thead>
                <tr>
                  <th className="px-4 py-3 border-b border-border text-left font-bold">Date</th>
                  <th className="px-4 py-3 border-b border-border text-left font-bold">Particular</th>
                  <th className="px-4 py-3 border-b border-border text-left font-bold">Expense</th>
                  <th className="px-4 py-3 border-b border-border text-left font-bold">Cash in</th>
                  <th className="px-4 py-3 border-b border-border text-left font-bold">Balance</th>
                  <th className="px-4 py-3 border-b border-border font-bold text-right app-data-table__actions">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <CashTransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <CashTransactionModal
        show={showModal}
        editingId={editingId}
        formData={formData}
        errors={errors}
        saving={saving}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onTypeChange={handleCashTypeChange}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        title="Delete cash transaction"
        message="This will permanently remove the entry from your cash book."
        detail={
          deleteItem ? (
            <>
              <div className="app-modal__detail-row">
                <span className="app-modal__detail-label">Date</span>
                <span className="app-modal__detail-value">{formatCashDate(deleteItem.date)}</span>
              </div>
              <div className="app-modal__detail-row">
                <span className="app-modal__detail-label">Particular</span>
                <span className="app-modal__detail-value">{deleteItem.particular || "—"}</span>
              </div>
              <div className="app-modal__detail-row">
                <span className="app-modal__detail-label">Amount</span>
                <span className="app-modal__detail-value">
                  {deleteItem.debit > 0
                    ? `Rs. ${formatCashAmount(deleteItem.debit)} (Expense)`
                    : `Rs. ${formatCashAmount(deleteItem.credit)} (Cash in)`}
                </span>
              </div>
            </>
          ) : null
        }
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default CashInHandPage;
