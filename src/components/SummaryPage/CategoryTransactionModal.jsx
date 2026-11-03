import React, { useState, useEffect, useCallback } from "react";
import { Modal, Card, Row, Col, Table, Spinner } from "react-bootstrap";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import { THEME } from "../../theme/colors";
import AppButton from "../ui/AppButton";

const CategoryTransactionModal = ({
  show,
  onHide,
  category,
  type, // 'income' or 'expense'
  rangeStart,
  rangeEnd,
}) => {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const collectionName = type === 'income' ? 'income' : 'expenses';
      const transactionsRef = collection(db, collectionName);
      
      // Get all transactions for the selected month and category
      const allTransactions = [];
      const querySnapshot = await getDocs(transactionsRef);
      
      querySnapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const d = String(data.date || "").slice(0, 10);
        if (
          d >= rangeStart &&
          d <= rangeEnd &&
          data.category === category
        ) {
          allTransactions.push({
            id: docSnap.id,
            ...data,
            date: data.date,
          });
        }
      });

      // Sort by date
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions);

    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [type, rangeStart, rangeEnd, category]);

  useEffect(() => {
    if (show && category) {
      fetchTransactions();
    }
  }, [show, category, fetchTransactions]);

  const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('en-US', { 
      style: 'currency', 
      currency: 'PKR',
      maximumFractionDigits: 0 
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      className="app-modal category-transaction-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <div className="me-3 text-white">
            {type === 'income' ? <FaArrowUp /> : <FaArrowDown />}
          </div>
          <div>
            <h5 className="mb-0 text-white">{category} - Transaction History</h5>
            <small>
              {rangeStart && rangeEnd
                ? `${rangeStart} — ${rangeEnd}`
                : ""}
            </small>
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <>
            {/* Transaction Graph */}
            {transactions.length > 0 && (
              <Row className="mb-4">
                <Col>
                  <Card className="chart-card">
                    <Card.Header>
                      <h5 className="mb-0">Transaction Timeline</h5>
                    </Card.Header>
                    <Card.Body>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={transactions.map((transaction, index) => ({
                          name: `T${index + 1}`,
                          amount: Number(transaction.amount || 0),
                          date: new Date(transaction.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => formatCurrency(value)}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                return payload[0].payload.date;
                              }
                              return label;
                            }}
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              padding: '12px 16px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="amount" 
                            stroke={type === 'income' ? THEME.primary : THEME.danger}
                            strokeWidth={3}
                            dot={{ fill: type === 'income' ? THEME.primary : THEME.danger, strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Transactions Table */}
            <Row>
              <Col>
                <Card>
                  <Card.Header>
                    <h5 className="mb-0">Transactions</h5>
                  </Card.Header>
                  <Card.Body>
                    {transactions.length > 0 ? (
                      <div className="app-data-table-wrap mt-2">
                        <table className="app-data-table">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 border-b border-border text-left font-bold">Date</th>
                              <th className="px-4 py-3 border-b border-border text-left font-bold">Description</th>
                              <th className="px-4 py-3 border-b border-border text-left font-bold">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((transaction, index) => (
                              <tr key={transaction.id || index} className="hover:bg-raised transition-colors duration-150">
                                <td className="px-4 py-2 border-b border-border">{formatDate(transaction.date)}</td>
                                <td className="px-4 py-2 border-b border-border">{transaction.description || 'No description'}</td>
                                <td className={`px-4 py-2 border-b border-border fw-bold ${type === 'income' ? 'text-success' : 'text-danger'}`}>
                                  {type === 'income' ? '+' : '-'}{Number(transaction.amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-muted">
                          <h5>No transactions found</h5>
                          <p>No {type} transactions found for {category} in this month.</p>
                        </div>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <AppButton tone="secondary" size="sm" onClick={onHide}>
          Close
        </AppButton>
      </Modal.Footer>
    </Modal>
  );
};

export default CategoryTransactionModal; 