import React, { useState, useEffect } from "react";
import { Modal, Form, Alert, Row, Col } from "react-bootstrap";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { FaPlus, FaUniversity } from "react-icons/fa";
import { RiWalletLine } from "react-icons/ri";
import AppDatePicker from "../ui/AppDatePicker";
import AppButton from "../ui/AppButton";

const emptyForm = () => ({
  date: new Date().toISOString().split("T")[0],
  amount: "",
  description: "",
  category: "",
  source: "",
});

const TransactionModal = ({
  show,
  handleClose,
  onSuccess,
  canPickTransactionDate = true,
  editItem = null,
}) => {
  const isEdit = Boolean(editItem?.id);
  const [transactionType, setTransactionType] = useState("expense");
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [customCategories, setCustomCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("primary");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const expenseCategories = [
    { name: "Food", color: "primary" },
    { name: "Grocery", color: "success" },
    { name: "Office Maintenance", color: "warning" },
    { name: "Salaries A", color: "danger" },
    { name: "Salaries H", color: "info" },
    { name: "Salaries Combined", color: "secondary" },
    { name: "Utility Bills", color: "dark" },
    { name: "Water", color: "info" },
    { name: "Equipments", color: "primary" },
    { name: "Stationery/Scan/Print", color: "success" },
    { name: "Misc.", color: "warning" },
    { name: "Office Rent", color: "danger" },
    { name: "Gym Payment", color: "info" },
    { name: "Blessing", color: "secondary" },
    { name: "Laptop Custom Clearence", color: "dark" },
    { name: "Laptop Cargo Custom Booking", color: "primary" },
    { name: "Event", color: "success" },
    { name: "Loan", color: "warning" },
    { name: "Upwork job", color: "danger" },
    { name: "Income Tax", color: "info" },
    { name: "Lawyer Fee", color: "secondary" },
    { name: "Reimbursable Expenses", color: "dark" },
    { name: "Travel Exp", color: "primary" },
    { name: "Advertising Expense", color: "success" },
    { name: "Courrier", color: "warning" },
    { name: "Postex", color: "danger" },
    { name: "Employee Gift", color: "info" },
    { name: "Kashif", color: "secondary" },
    { name: "Late Return", color: "dark" },
    { name: "Repair", color: "primary" },
    { name: "Electric Items", color: "success" },
    { name: "EBF", color: "warning" },
    { name: "Flat Rent", color: "danger" },
    { name: "Car Service/Maintainence", color: "info" },
    { name: "Membership/Certification fee", color: "secondary" },
  ];

  const incomeCategories = [
    { name: "Raheel", color: "primary" },
    { name: "Zeeshan", color: "success" },
    { name: "Other", color: "warning" },
    { name: "Company Account", color: "danger" },
    { name: "Carried Forward", color: "info" },
    { name: "Rent Received From Kashif", color: "secondary" },
    { name: "FA Salaries", color: "dark" },
  ];

  const categoryColors = [
    { value: "primary", label: "Lime", color: "#b8f34b" },
    { value: "secondary", label: "Slate", color: "#6b6b66" },
    { value: "success", label: "Forest", color: "#4d7c0f" },
    { value: "danger", label: "Red", color: "#dc2626" },
    { value: "warning", label: "Amber", color: "#f59e0b" },
    { value: "info", label: "Soft Lime", color: "#a6de3a" },
    { value: "light", label: "Warm", color: "#efefe9" },
    { value: "dark", label: "Charcoal", color: "#171717" }
  ];

  useEffect(() => {
    if (!show) return;

    if (editItem?.id) {
      const type = editItem.transactionType === "income" ? "income" : "expense";
      setTransactionType(type);
      setFormData({
        date: editItem.date || new Date().toISOString().split("T")[0],
        amount: editItem.amount != null ? String(editItem.amount) : "",
        description: editItem.description || "",
        category: editItem.category || "",
        source: editItem.source || "",
      });
      setErrors({});
      setShowAddCategory(false);
      return;
    }

    setTransactionType("expense");
    setFormData(emptyForm());
    setErrors({});
    setShowAddCategory(false);

    if (!canPickTransactionDate) {
      setFormData((prev) => ({
        ...prev,
        date: new Date().toISOString().split("T")[0],
      }));
    }
  }, [show, editItem, canPickTransactionDate]);

  useEffect(() => {
    const fetchCustomCategories = async () => {
      try {
        const categoriesRef = collection(db, "transaction_categories");
        const q = query(categoriesRef, where("type", "==", transactionType));
        const querySnapshot = await getDocs(q);
        const categories = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomCategories(categories);
      } catch (error) {
        console.error("Error fetching custom categories:", error);
      }
    };
    fetchCustomCategories();
  }, [transactionType]);

  const handleAddCustomCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const categoriesRef = collection(db, "transaction_categories");
      const newCategoryDoc = await addDoc(categoriesRef, {
        name: newCategory.trim(),
        color: newCategoryColor,
        type: transactionType,
        createdAt: new Date().toISOString()
      });
      setCustomCategories(prev => [...prev, {
        id: newCategoryDoc.id,
        name: newCategory.trim(),
        color: newCategoryColor
      }]);
      setFormData(prev => ({ ...prev, category: newCategory.trim() }));
      setNewCategory("");
      setNewCategoryColor("primary");
      setShowAddCategory(false);
    } catch (error) {
      console.error("Error adding custom category:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0) {
      newErrors.amount = "Valid amount is required";
    }
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (transactionType === "income" && !formData.source?.trim()) {
      newErrors.source = "Source is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const collectionName = transactionType === "expense" ? "expenses" : "income";
      const payload = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        ...(transactionType === "income" ? { source: formData.source } : {}),
      };

      if (isEdit) {
        await updateDoc(doc(db, collectionName, editItem.id), payload);

        if (transactionType === "expense" && editItem.cashTransactionId) {
          await updateDoc(doc(db, "cash_transactions", editItem.cashTransactionId), {
            date: payload.date,
            particular: payload.description,
            debit: payload.amount,
            credit: 0,
            type: "debit",
          });
        }

        onSuccess?.({ ...payload, id: editItem.id, type: transactionType, mode: "edit" });
      } else {
        const dataToSubmit = {
          ...payload,
          type: transactionType,
          createdAt: new Date().toISOString(),
          ...(transactionType === "expense" ? { paymentSource: "bank" } : {}),
        };
        await addDoc(collection(db, collectionName), dataToSubmit);
        onSuccess?.(dataToSubmit);
      }

      handleClose();
      setFormData(emptyForm());
    } catch (error) {
      console.error("Error saving transaction: ", error);
      setErrors({ submit: "An error occurred while saving. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    if (isEdit) return;
    setTransactionType(type);
    setFormData((prev) => ({ ...prev, category: "", source: "" }));
    setErrors({});
    setShowAddCategory(false);
  };

  const allCategories = transactionType === "expense" 
    ? [...expenseCategories, ...customCategories]
    : [...incomeCategories, ...customCategories];

  return (
    <Modal
      show={show}
      onHide={loading ? undefined : handleClose}
      centered
      size="lg"
      backdrop={loading ? "static" : true}
      keyboard={!loading}
      className="app-modal transaction-modal add-transaction-modal"
    >
        <Modal.Header closeButton={!loading}>
          <Modal.Title>{isEdit ? "Edit transaction" : "Add transaction"}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={`add-transaction-modal-body${loading ? " is-saving" : ""}`}>
          {loading ? (
            <div className="tx-modal-saving" role="status" aria-live="polite">
              <span className="tx-modal-saving__spinner" aria-hidden="true" />
              <span>Saving transaction…</span>
            </div>
          ) : null}
          <Form
            id="add-transaction-form"
            onSubmit={handleSubmit}
            className="add-transaction-modal-form"
            aria-busy={loading || undefined}
          >
            {Object.keys(errors).length > 0 && (
              <Alert variant="danger" className="mb-3 py-2">
                <ul className="mb-0 small">
                  {Object.values(errors).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
            
            {!isEdit ? (
              <div className="tx-modal-type">
                <span className="tx-modal-type__label">Type</span>
                <div className="tx-modal-type__switch" role="group" aria-label="Transaction type">
                  <button
                    type="button"
                    className={`tx-modal-type__btn tx-modal-type__btn--expense${transactionType === "expense" ? " is-active" : ""}`}
                    onClick={() => handleTypeChange("expense")}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`tx-modal-type__btn tx-modal-type__btn--income${transactionType === "income" ? " is-active" : ""}`}
                    onClick={() => handleTypeChange("income")}
                  >
                    Income
                  </button>
                </div>
              </div>
            ) : (
              <p className="app-modal__hint mb-3">
                Editing {transactionType === "expense" ? "expense" : "income"} entry
              </p>
            )}

            <Row className="g-3 add-transaction-modal-fields">
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>
                    Date
                    {!canPickTransactionDate ? (
                      <span className="tx-modal-label-note">Auto today</span>
                    ) : null}
                  </Form.Label>
                  <AppDatePicker
                    value={formData.date}
                    onChange={(v) => {
                      handleChange({ target: { name: "date", value: v } });
                    }}
                    size="middle"
                    status={errors.date ? "error" : undefined}
                    disabled={!canPickTransactionDate}
                    allowClear={false}
                    className={`tx-modal-datepicker${!canPickTransactionDate ? " opacity-75" : ""}`}
                  />
                  {errors.date ? (
                    <div className="text-danger small mt-1">{errors.date}</div>
                  ) : null}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="form-group">
                  <Form.Label>Amount (PKR)</Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    isInvalid={!!errors.amount}
                    step="0.01"
                    min="0"
                    placeholder="Enter amount"
                  />
                </Form.Group>
              </Col>

              <Col xs={12}>
                <Form.Group className="form-group">
                  <Form.Label>Category</Form.Label>
                  <div className="category-input-group">
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      isInvalid={!!errors.category}
                    >
                      <option value="">Select category</option>
                      {allCategories.map((category) => (
                        <option key={category.name} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </Form.Select>
                    <button
                      type="button"
                      className={`add-category-btn${showAddCategory ? " is-open" : ""}`}
                      onClick={() => setShowAddCategory((v) => !v)}
                      title={showAddCategory ? "Hide new category" : "Add category"}
                      aria-label={showAddCategory ? "Hide new category" : "Add category"}
                    >
                      <FaPlus aria-hidden="true" />
                    </button>
                  </div>
                  {showAddCategory && (
                    <div className="add-category-section">
                      <div className="add-category-section__row">
                        <Form.Control
                          type="text"
                          placeholder="New category"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          className="flex-fill"
                        />
                        <Form.Select
                          value={newCategoryColor}
                          onChange={(e) => setNewCategoryColor(e.target.value)}
                          className="add-category-section__color"
                        >
                          {categoryColors.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                          ))}
                        </Form.Select>
                        <AppButton type="button" tone="primary" size="xs" onClick={handleAddCustomCategory}>
                          Add
                        </AppButton>
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>

              {transactionType === "income" && (
                <Col xs={12}>
                  <Form.Group className="form-group">
                    <Form.Label>Payment method</Form.Label>
                    <div className="tx-modal-pay" role="group" aria-label="Payment method">
                      <button
                        type="button"
                        className={`tx-modal-pay__btn${formData.source === "Cash" ? " is-active" : ""}`}
                        onClick={() =>
                          handleChange({ target: { name: "source", value: "Cash" } })
                        }
                      >
                        <RiWalletLine aria-hidden="true" />
                        <span>Cash</span>
                      </button>
                      <button
                        type="button"
                        className={`tx-modal-pay__btn${formData.source === "Online Payment" ? " is-active" : ""}`}
                        onClick={() =>
                          handleChange({ target: { name: "source", value: "Online Payment" } })
                        }
                      >
                        <FaUniversity aria-hidden="true" />
                        <span>Online</span>
                      </button>
                    </div>
                    {errors.source ? (
                      <div className="text-danger small mt-1">{errors.source}</div>
                    ) : null}
                  </Form.Group>
                </Col>
              )}

              <Col md={12}>
                <Form.Group className="form-group">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    isInvalid={!!errors.description}
                    rows={4}
                    placeholder={`Enter ${transactionType} description`}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <AppButton
            type="button"
            tone="ghost"
            onClick={handleClose}
            disabled={loading}
            size="sm"
          >
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            form="add-transaction-form"
            tone="primary"
            loading={loading}
            loadingText="Saving…"
            size="sm"
          >
            {isEdit
              ? "Save changes"
              : `Save ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)}`}
          </AppButton>
        </Modal.Footer>
      </Modal>
  );
};

export default TransactionModal;
