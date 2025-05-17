import React from "react";
import "../styles/DeleteConfirmationModal.css"; // Create this CSS file

function DeleteConfirmationModal({ isOpen, onConfirm, onCancel, courseId }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Confirm Delete</h2>
        <p>Are you sure you want to delete this course?</p>
        <div className="delete-modal-actions">
          <button onClick={onConfirm} className="delete-confirm-button">
            Yes, Delete
          </button>
          <button onClick={onCancel} className="delete-cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal;
