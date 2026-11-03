import React, { useState } from "react";
import { Modal, Form, Alert, ProgressBar, Spinner } from "react-bootstrap";
import { db } from "../../firebase";
import { collection, writeBatch, doc } from "firebase/firestore";
import { FaFileExcel, FaUpload } from "react-icons/fa";
import AppButton from "../ui/AppButton";
const ExcelImportModal = ({ show, handleClose, onSuccess }) => {
  const [importFile, setImportFile] = useState(null);
  const [expenseData, setExpenseData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importError, setImportError] = useState("");
  const [parsing, setParsing] = useState(false);

  const handleCloseImport = () => {
    setImportFile(null);
    setExpenseData([]);
    setIncomeData([]);
    setImportProgress(0);
    setImportError("");
    setParsing(false);
    handleClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "application/excel",
      "application/x-excel",
      "application/x-msexcel"
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setImportError("Please select a valid Excel file (.xlsx or .xls)");
      setImportFile(null);
      setExpenseData([]);
      setIncomeData([]);
      return;
    }

    setImportFile(file);
    setImportError("");
    parseExcelFile(file);
  };

  const extractYearFromFilename = (filename) => {
    const yearMatch = filename.match(/(\d{4})/);
    return yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  };

  const parseDate = (dateValue, fileYear, XLSX) => {
    if (!dateValue) return "";

    if (typeof dateValue === 'number') {
      try {
        const excelDate = XLSX.SSF.parse_date_code(dateValue);
        let year = excelDate.y;
        if (year < 2000 || year > 2100 || Math.abs(year - fileYear) > 10) {
          year = fileYear;
        }
        return `${year}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
      } catch {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        if (isNaN(date.getTime())) return "";
        let year = date.getFullYear();
        if (year < 2000 || year > 2100 || Math.abs(year - fileYear) > 10) {
          year = fileYear;
        }
        return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
    }

    const dateStr = String(dateValue).trim();
    
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parsedYear = parseInt(dateStr.substring(0, 4), 10);
      if (parsedYear < 2000 || parsedYear > 2100 || Math.abs(parsedYear - fileYear) > 10) {
        return `${fileYear}${dateStr.substring(4)}`;
      }
      return dateStr;
    }

    if (dateStr.match(/\d{1,2}-[A-Za-z]{3}(-\d{4})?/)) {
      const parts = dateStr.split('-');
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIndex = monthNames.findIndex(m => m === parts[1].toLowerCase());
      if (monthIndex !== -1) {
        let year = parts.length > 2 && parts[2] ? parseInt(parts[2], 10) : fileYear;
        if (year < 2000 || year > 2100 || Math.abs(year - fileYear) > 10) {
          year = fileYear;
        }
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
      }
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      let year = date.getFullYear();
      if (year < 2000 || year > 2100 || Math.abs(year - fileYear) > 10) {
        year = fileYear;
      }
      return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    return "";
  };

  const parseAmount = (amountValue) => {
    if (!amountValue) return 0;
    const amountStr = String(amountValue).replace(/[^\d.-]/g, '');
    return parseFloat(amountStr) || 0;
  };

  const findSectionHeaders = (rawData) => {
    let expensesHeaderRow = -1;
    let inwardsHeaderRow = -1;
    let expensesStartCol = -1;
    let inwardsStartCol = -1;
    let expensesDataHeaderRow = -1;
    let inwardsDataHeaderRow = -1;

    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      
      for (let j = 0; j < row.length; j++) {
        const cellValue = String(row[j] || '').toLowerCase().trim();
        if (cellValue.includes('expense') && expensesHeaderRow === -1) {
          expensesHeaderRow = i;
          expensesStartCol = j;
        }
        if ((cellValue.includes('inward') || cellValue.includes('income')) && inwardsHeaderRow === -1) {
          inwardsHeaderRow = i;
          inwardsStartCol = j;
        }
      }
    }

    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      if (!row) continue;
      
      if (expensesStartCol >= 0 && expensesDataHeaderRow === -1) {
        const hasDate = row.some((cell, idx) => {
          const cellStr = String(cell || '').toLowerCase().trim();
          return cellStr.includes('date') && Math.abs(idx - expensesStartCol) <= 5;
        });
        const hasAmount = row.some((cell, idx) => {
          const cellStr = String(cell || '').toLowerCase().trim();
          return cellStr.includes('amount') && Math.abs(idx - expensesStartCol) <= 5;
        });
        if (hasDate && hasAmount && i > expensesHeaderRow) {
          expensesDataHeaderRow = i;
        }
      }
      
      if (inwardsStartCol >= 0 && inwardsDataHeaderRow === -1) {
        const hasDate = row.some((cell, idx) => {
          const cellStr = String(cell || '').toLowerCase().trim();
          return cellStr.includes('date') && Math.abs(idx - inwardsStartCol) <= 5;
        });
        const hasAmount = row.some((cell, idx) => {
          const cellStr = String(cell || '').toLowerCase().trim();
          return cellStr.includes('amount') && Math.abs(idx - inwardsStartCol) <= 5;
        });
        if (hasDate && hasAmount && i > inwardsHeaderRow) {
          inwardsDataHeaderRow = i;
        }
      }
    }

    return { 
      expensesHeaderRow: expensesDataHeaderRow !== -1 ? expensesDataHeaderRow : (expensesHeaderRow !== -1 ? expensesHeaderRow + 1 : -1), 
      inwardsHeaderRow: inwardsDataHeaderRow !== -1 ? inwardsDataHeaderRow : (inwardsHeaderRow !== -1 ? inwardsHeaderRow + 1 : -1), 
      expensesStartCol, 
      inwardsStartCol 
    };
  };

  const getColumnIndices = (headerRow, startCol) => {
    const headers = [];
    const maxCol = Math.min(startCol + 20, headerRow ? headerRow.length : startCol + 20);
    
    for (let i = startCol; i < maxCol; i++) {
      headers.push(String(headerRow[i] || '').toLowerCase().trim());
    }
    
    const dateIndex = headers.findIndex(h => h.includes('date') && !h.includes('update'));
    const amountIndex = headers.findIndex(h => h.includes('amount') || h.includes('amt'));
    const descriptionIndex = headers.findIndex(h => h.includes('description') || h.includes('desc') || h.includes('detail') || h.includes('note'));
    const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('cat') || h.includes('type'));

    return {
      dateCol: dateIndex !== -1 ? startCol + dateIndex : startCol,
      amountCol: amountIndex !== -1 ? startCol + amountIndex : (dateIndex !== -1 ? startCol + dateIndex + 1 : startCol + 1),
      descriptionCol: descriptionIndex !== -1 ? startCol + descriptionIndex : (dateIndex !== -1 ? startCol + dateIndex + 2 : startCol + 2),
      categoryCol: categoryIndex !== -1 ? startCol + categoryIndex : (dateIndex !== -1 ? startCol + dateIndex + 3 : startCol + 3)
    };
  };

  const parseSection = (rawData, headerDataRow, startCol, fileYear, XLSX, isIncome = false, stopCol = null) => {
    if (headerDataRow === -1 || startCol === -1 || !rawData[headerDataRow]) return [];

    const headerRow = rawData[headerDataRow];
    const { dateCol, amountCol, descriptionCol, categoryCol } = getColumnIndices(headerRow, startCol);
    const parsedData = [];
    let consecutiveEmptyRows = 0;

    for (let i = headerDataRow + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) {
        consecutiveEmptyRows++;
        if (consecutiveEmptyRows > 10) break;
        continue;
      }
      consecutiveEmptyRows = 0;

      if (stopCol !== null && stopCol >= 0 && row[stopCol]) {
        const stopValue = String(row[stopCol]).toLowerCase().trim();
        if (stopValue === 'inward' || stopValue === 'inwards' || stopValue === 'income') {
          const isHeaderRow = row.some((cell) => {
            const cellStr = String(cell || '').toLowerCase();
            return cellStr.includes('date') || cellStr.includes('amount') || cellStr.includes('description');
          });
          if (isHeaderRow) {
            break;
          }
        }
      }

      let dateValue = row[dateCol];
      let amountValue = row[amountCol];
      let descriptionValue = row[descriptionCol];
      let categoryValue = row[categoryCol];

      if (!dateValue && !amountValue && !descriptionValue && !categoryValue) {
        if (i === headerDataRow + 1) {
          dateValue = row[dateCol + 1] || row[dateCol - 1] || row[startCol];
          amountValue = row[amountCol + 1] || row[amountCol - 1] || row[startCol + 1];
          descriptionValue = row[descriptionCol + 1] || row[descriptionCol - 1] || row[startCol + 2];
          categoryValue = row[categoryCol + 1] || row[categoryCol - 1] || row[startCol + 3];
          
          if (!dateValue && !amountValue && !descriptionValue && !categoryValue) {
            continue;
          }
        } else {
          continue;
        }
      }

      const parsedDate = parseDate(dateValue, fileYear, XLSX);
      const parsedAmount = parseAmount(amountValue);
      const description = String(descriptionValue || '').trim();
      const category = String(categoryValue || '').trim();

      if (!parsedDate || !parsedDate.match(/^\d{4}-\d{2}-\d{2}$/) || parsedAmount <= 0 || !description || !category) {
        continue;
      }

      parsedData.push({
        date: parsedDate,
        amount: parsedAmount,
        description,
        category,
        source: isIncome ? "Cash" : ""
      });
    }

    return parsedData;
  };

  const parseExcelFile = (file) => {
    setParsing(true);
    setImportProgress(10);
    setImportError("");

    const fileYear = extractYearFromFilename(file.name);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        setImportProgress(30);
        const XLSX = await import("xlsx");
        const binaryString = e.target.result;
        const workbook = XLSX.read(binaryString, { type: "binary" });
        
        setImportProgress(50);
        
        const sheetNames = workbook.SheetNames;
        const transactionSheetName = sheetNames.find(name => 
          name.toLowerCase().includes('transaction')
        );

        if (!transactionSheetName) {
          setImportError("Excel file must contain a sheet named 'Transaction'");
          setParsing(false);
          return;
        }

        const sheet = workbook.Sheets[transactionSheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { 
          defval: '',
          raw: false,
          header: 1
        });

        if (rawData.length < 3) {
          setImportError("Transaction sheet must have at least 3 rows (title, headers, and data)");
          setParsing(false);
          return;
        }

        const { expensesHeaderRow, inwardsHeaderRow, expensesStartCol, inwardsStartCol } = findSectionHeaders(rawData);
        
        const expensesHeaderDataRow = expensesHeaderRow;
        const inwardsHeaderDataRow = inwardsHeaderRow;

        setImportProgress(60);
        const parsedExpenses = parseSection(
          rawData, 
          expensesHeaderDataRow, 
          expensesStartCol, 
          fileYear,
          XLSX,
          false, 
          inwardsStartCol
        );

        setImportProgress(80);
        const parsedIncomes = parseSection(
          rawData, 
          inwardsHeaderDataRow, 
          inwardsStartCol, 
          fileYear,
          XLSX,
          true
        );

        setImportProgress(100);
        setExpenseData(parsedExpenses);
        setIncomeData(parsedIncomes);
        setParsing(false);

        if (parsedExpenses.length === 0 && parsedIncomes.length === 0) {
          setImportError("No valid transactions found in the Excel file. Please ensure the file has 'Expenses' and 'Inwards' sections with Date, Amount, Description, and Category columns.");
        }
      } catch {
        setImportError("Error reading Excel file. Please check the format and try again.");
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setImportError("Error reading file. Please try again.");
      setParsing(false);
    };

    reader.readAsBinaryString(file);
  };

  const importBatch = async (data, collectionName, type) => {
    const batchSize = 500;
    let imported = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batchData = data.slice(i, i + batchSize);
      const batch = writeBatch(db);
      
      batchData.forEach((item) => {
        const docRef = doc(collection(db, collectionName));
        batch.set(docRef, {
          ...item,
          amount: parseFloat(item.amount),
          type,
          createdAt: new Date().toISOString()
        });
      });

      try {
        await batch.commit();
        imported += batchData.length;
      } catch (err) {
        throw new Error(`Failed to import batch: ${err.message}`);
      }
    }

    return imported;
  };

  const handleImportTransactions = async () => {
    if (expenseData.length === 0 && incomeData.length === 0) return;

    setImportLoading(true);
    setImportProgress(0);
    setImportError("");

    try {
      const totalItems = expenseData.length + incomeData.length;
      let importedExpenses = 0;
      let importedIncomes = 0;

      if (expenseData.length > 0) {
        importedExpenses = await importBatch(expenseData, "expenses", "expense");
        setImportProgress(Math.round((importedExpenses / totalItems) * 100));
      }

      if (incomeData.length > 0) {
        importedIncomes = await importBatch(incomeData, "income", "income");
        setImportProgress(100);
      }

      setImportLoading(false);
      
      const expectedTotal = expenseData.length + incomeData.length;
      const importedTotal = importedExpenses + importedIncomes;
      
      if (importedExpenses !== expenseData.length || importedIncomes !== incomeData.length) {
        const missingExpenses = expenseData.length - importedExpenses;
        const missingIncomes = incomeData.length - importedIncomes;
        setImportError(`Warning: Only ${importedTotal} out of ${expectedTotal} transactions were imported. ${missingExpenses} expenses and ${missingIncomes} income transactions failed.`);
      }
      
      handleCloseImport();
      
      setTimeout(() => {
        onSuccess({ 
          importedExpenses,
          importedIncomes,
          total: importedExpenses + importedIncomes
        });
      }, 1000);
    } catch {
      setImportError("Error importing transactions. Please try again.");
      setImportLoading(false);
    }
  };

  const totalTransactions = expenseData.length + incomeData.length;

  return (
    <Modal 
      show={show} 
      onHide={handleCloseImport} 
      centered 
      size="lg"
      className="app-modal excel-import-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FaFileExcel className="me-2" />
          Import Excel File (Expenses & Inwards)
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Select Excel File (.xlsx or .xls)</Form.Label>
          <Form.Control
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={importLoading || parsing}
          />
          {importFile && (
            <Form.Text className="text-muted">
              Selected: {importFile.name}
            </Form.Text>
          )}
        </Form.Group>

        {importError && (
          <Alert variant="danger" className="mb-3">
            {importError}
          </Alert>
        )}

        {(parsing || importLoading) && importProgress > 0 && (
          <div className="mb-3">
            <ProgressBar 
              now={importProgress} 
              label={`${importProgress}%`}
              variant="success"
              animated
            />
            <p className="text-center mt-2 text-muted small">
              {parsing ? "Reading and parsing file..." : 
               importProgress < 50 ? "Importing expenses..." : 
               importProgress < 100 ? "Importing income..." : 
               "Finalizing..."}
            </p>
          </div>
        )}

        {totalTransactions > 0 && !parsing && !importLoading && (
          <Alert variant="success" className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Ready to import:</strong>
                {expenseData.length > 0 && (
                  <span className="ms-2">
                    <strong>{expenseData.length}</strong> expense(s)
                  </span>
                )}
                {incomeData.length > 0 && (
                  <span className="ms-2">
                    <strong>{incomeData.length}</strong> income transaction(s)
                  </span>
                )}
              </div>
              <div className="text-muted small">
                Total: <strong>{totalTransactions}</strong> transaction(s)
              </div>
            </div>
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <AppButton
          tone="secondary"
          size="sm"
          onClick={handleCloseImport}
          disabled={importLoading}
        >
          Cancel
        </AppButton>
        <AppButton
          tone="primary"
          size="sm"
          onClick={handleImportTransactions}
          disabled={totalTransactions === 0 || importLoading || parsing}
        >
          {importLoading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Importing...
            </>
          ) : (
            <>
              <FaUpload aria-hidden="true" />
              Import {totalTransactions} Transaction(s)
            </>
          )}
        </AppButton>
      </Modal.Footer>
    </Modal>
  );
};

export default ExcelImportModal;
