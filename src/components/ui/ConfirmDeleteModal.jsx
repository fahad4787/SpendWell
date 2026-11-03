import React from "react";
import { Modal } from "react-bootstrap";
import AppButton from "./AppButton";

const ConfirmDeleteModal = ({
  show,
  title = "Delete",
  message = "Are you sure you want to delete this item?",
  detail = null,
  confirmText = "Delete",
  cancelText = "Cancel",
  onClose,
  onConfirm,
  disabled = false,
}) => {
  return (
    <Modal show={show} onHide={onClose} centered className="app-modal app-modal--danger">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {typeof message === "string" ? <p className="app-modal__lead">{message}</p> : message}
        {detail ? <div className="app-modal__detail">{detail}</div> : null}
      </Modal.Body>
      <Modal.Footer>
        <AppButton tone="ghost" size="sm" onClick={onClose} disabled={disabled}>
          {cancelText}
        </AppButton>
        <AppButton tone="danger" size="sm" onClick={onConfirm} disabled={disabled}>
          {confirmText}
        </AppButton>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDeleteModal;
