// Modal.tsx
import React, { ReactNode, useEffect } from "react";
import ReactDOM from "react-dom";
import styles from "./Modal.module.css";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  variant?: "default" | "success" | "error";
}

const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  variant = "default",
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles[variant]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.sunContainer}>
          <div className={styles.sun}>
            <div className={styles.sunFace}>
              <div className={styles.sunEyes}></div>
              <div className={styles.sunSmile}></div>
            </div>
          </div>
          <div className={styles.greeting}>GM!</div>
        </div>

        <button className={styles.closeButton} onClick={onClose}>
          <span className={styles.closeText}>close</span>
          <div className={styles.closeIcon}></div>
        </button>

        <div className={styles.content}>{children}</div>

        <div className={styles.sparkles}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={styles.sparkle}
              style={
                {
                  "--delay": `${i * 0.3}s`,
                  "--position": `${i * 30}deg`,
                } as React.CSSProperties
              }
            ></div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
