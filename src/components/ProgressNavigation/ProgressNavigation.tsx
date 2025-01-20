// ProgressNavigation.tsx
import React, { useState } from "react";
import styles from "./ProgressNavigation.module.css";

interface ProgressNavigationProps {
  currentStep: number;
  onBack: () => void;
  onStepChange: (step: number) => void;
}

const ProgressNavigation: React.FC<ProgressNavigationProps> = ({
  currentStep,
  onBack,
  onStepChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      title: "Connect Wallet",
      description: "Link your crypto wallet",
      icon: "💳",
    },
    {
      title: "Connect X",
      description: "Connect your Twitter account",
      icon: "🔗",
    },

    {
      title: "Send Transaction",
      description: "Complete verification",
      icon: "✨",
    },
  ];

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
      onBack();
    }
  };

  return (
    <div
      className={`${styles.progressContainer} ${
        isExpanded ? styles.expanded : ""
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={styles.decorativeLine}></div>
      <div className={styles.content}>
        {currentStep > 0 && (
          <button onClick={handleBack} className={styles.backButton}>
            <span className={styles.backArrow}>←</span>
            <span className={styles.backText}>Back</span>
          </button>
        )}

        <div className={styles.progressWrapper}>
          <div className={styles.progressBar}>
            <div className={styles.progressGlow} />
            <div
              className={styles.progressFill}
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            />

            <div className={styles.stepsContainer}>
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`${styles.step} ${
                    index <= currentStep ? styles.active : ""
                  } ${index === currentStep ? styles.current : ""}`}
                >
                  <div className={styles.stepCircleWrapper}>
                    <div className={styles.stepCircle}>
                      <div className={styles.circleGlow} />
                      {index < currentStep ? (
                        <span className={styles.checkmark}>✓</span>
                      ) : index === currentStep ? (
                        <span className={styles.stepIcon}>{step.icon}</span>
                      ) : (
                        <span className={styles.stepNumber}>{index + 1}</span>
                      )}
                    </div>
                    <div className={styles.pulseRing}></div>
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>{step.title}</div>
                    <div className={styles.stepDescription}>
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressNavigation;
