import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Container, Card } from "react-bootstrap";
import { db } from "../firebase";
import { auth } from "../firebase";
import { getDoc, doc } from "firebase/firestore";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { RiFileExcel2Line } from "react-icons/ri";
import Heading from "../components/Heading";
import TransactionModal from "../components/TransactionModal/TransactionModal";
import ExcelImportModal from "../components/ExcelImportModal/ExcelImportModal";
import AppDateFilter from "../components/ui/AppDateFilter";
import AppButton from "../components/ui/AppButton";
import AppLoader from "../components/ui/AppLoader";
import { useAppToast } from "../components/ui/AppToastProvider";
import { defaultExpenseRange } from "../utils/expenseRange";
import {
  EXPENSE_VIEWS,
  expenseViewFromPath,
  expenseViewPath,
  normalizeExpenseView,
} from "../utils/expenseViews";

const SummaryPage = lazy(() => import("../components/SummaryPage/SummaryPage"));
const TransactionPage = lazy(() => import("../components/TransactionPage/TransactionPage"));
const CashInHandPage = lazy(() => import("../components/CashInHandPage/CashInHandPage"));

const Expense = () => {
  const { showToast } = useAppToast();
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [cashAddRequestKey, setCashAddRequestKey] = useState(0);
  const [{ rangeStart, rangeEnd }, setRange] = useState(() => defaultExpenseRange());
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const legacyView = searchParams.get("view");
  const activeView = expenseViewFromPath(pathname);
  const activeViewMeta = EXPENSE_VIEWS.find((view) => view.key === activeView) || EXPENSE_VIEWS[0];

  const handleDateFilterChange = ({ rangeStart: start, rangeEnd: end }) => {
    if (!start || !end) return;
    setRange((prev) => {
      const nextStart = start;
      const nextEnd = end < nextStart ? nextStart : end;
      if (prev.rangeStart === nextStart && prev.rangeEnd === nextEnd) return prev;
      return { rangeStart: nextStart, rangeEnd: nextEnd };
    });
  };

  const handleModalClose = () => setShowModal(false);
  const handleModalShow = () => setShowModal(true);

  const handleFormSuccess = () => {
    setRefreshKey((k) => k + 1);
    setShowModal(false);
    showToast({ message: "Transaction added successfully!", variant: "success" });
  };

  const handleImportSuccess = () => {
    setShowImportModal(false);
    setRefreshKey((prev) => prev + 1);
    showToast({ message: "Excel import completed successfully!", variant: "success" });
  };

  const bumpExpenseData = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleHeaderAdd = () => {
    if (activeView === "cash") {
      setCashAddRequestKey((k) => k + 1);
      return;
    }
    handleModalShow();
  };

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            setIsAdmin(role === "admin");
            setUserRole(role ?? null);
          }
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      }
    };

    checkUserRole();
  }, []);

  // Reset pending cash-add signal when leaving the cash view
  useEffect(() => {
    if (activeView !== "cash" && cashAddRequestKey !== 0) {
      setCashAddRequestKey(0);
    }
  }, [activeView, cashAddRequestKey]);

  const showAddAction = activeView === "transactions" || activeView === "cash";

  const activeViewContent = useMemo(() => {
    if (activeView === "transactions") {
      return (
        <TransactionPage
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          refreshKey={refreshKey}
          isAdmin={isAdmin}
          canPickTransactionDate={isAdmin || userRole === "expense_manager"}
        />
      );
    }
    if (activeView === "cash") {
      return (
        <CashInHandPage
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          refreshKey={refreshKey}
          isAdmin={isAdmin}
          onDataChanged={bumpExpenseData}
          addRequestKey={cashAddRequestKey}
        />
      );
    }
    return (
      <SummaryPage
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        refreshKey={refreshKey}
      />
    );
  }, [
    activeView,
    bumpExpenseData,
    cashAddRequestKey,
    isAdmin,
    userRole,
    refreshKey,
    rangeStart,
    rangeEnd,
  ]);

  // Old bookmarks used /?view=cash — send them to /cash (etc.)
  if (legacyView) {
    return <Navigate to={expenseViewPath(normalizeExpenseView(legacyView))} replace />;
  }

  return (
    <section className="section expense-page">
      <Container fluid>
        <Heading
          title={activeViewMeta.label}
          subtitle={activeViewMeta.description}
          variant={activeView}
          btnTxt={showAddAction ? "Add transaction" : undefined}
          onBtnClick={showAddAction ? handleHeaderAdd : undefined}
          filters={
            <AppDateFilter
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onChange={handleDateFilterChange}
              defaultMode="month"
              allowAll={false}
              size="middle"
              className="app-date-filter--toolbar"
            />
          }
          actions={
            activeView === "summary" ? (
              <AppButton tone="primary" size="xs" onClick={() => setShowImportModal(true)}>
                <RiFileExcel2Line aria-hidden="true" />
                Import Excel
              </AppButton>
            ) : null
          }
        />

        <Card className="expense-page-card">
          <Card.Body>
            <div className="expense-view-panel">
              <Suspense fallback={<AppLoader message="Loading…" variant="inline" />}>
                {activeViewContent}
              </Suspense>
            </div>
          </Card.Body>
        </Card>

        <TransactionModal
          show={showModal}
          handleClose={handleModalClose}
          onSuccess={handleFormSuccess}
          canPickTransactionDate={isAdmin || userRole === "expense_manager"}
        />

        <ExcelImportModal
          show={showImportModal}
          handleClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      </Container>
    </section>
  );
};

export default Expense;
