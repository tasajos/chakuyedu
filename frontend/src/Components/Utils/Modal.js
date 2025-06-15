import React from 'react';
import { Modal as BootstrapModal, Button } from 'react-bootstrap';

// Este componente ahora usa las props estándar de react-bootstrap:
// show (en vez de isOpen), onHide (en vez de onClose)
const Modal = ({ show, onHide, title, children, footer }) => {
  return (
    <BootstrapModal show={show} onHide={onHide} centered>
      <BootstrapModal.Header closeButton>
        <BootstrapModal.Title>{title}</BootstrapModal.Title>
      </BootstrapModal.Header>
      <BootstrapModal.Body>
        {children}
      </BootstrapModal.Body>
      {footer && (
        <BootstrapModal.Footer>
          {footer}
        </BootstrapModal.Footer>
      )}
    </BootstrapModal>
  );
};

export default Modal;