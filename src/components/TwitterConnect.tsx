// TwitterConnect.tsx
import React, { useEffect, useState } from "react";
import type { TwitterConnectProps } from "@/src/types";
import styles from "./TwitterConnect.module.css";
import cloude from "@/public/image/xcloude.png";
import plane from "@/public/image/planepng.png";
import whcloude from "@/public/image/whcloude.png";
import bird from "@/public/image/birds.png";
import ButtonBackground from "./buttons/BlueButton";

const TwitterConnect: React.FC<TwitterConnectProps> = ({
  onConnectClick,
  isConnecting,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 20 - 10;
      const y = (e.clientY / window.innerHeight) * 20 - 10;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={styles.container}>
      {/* Blue wave with parallax effect */}
      <div
        className={styles.waveContainer}
        style={{
          transform: `translate(${mousePosition.x * 0.2}px, ${
            mousePosition.y * 0.2
          }px)`,
        }}
      >
        <img src={cloude.src} alt="" className={styles.waveImage} />
      </div>

      {/* Animated plane with smooth movement */}
      <div
        className={styles.planeContainer}
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        }}
      >
        <img src={plane.src} alt="" className={styles.planeImage} />
      </div>

      {/* Floating clouds */}
      <div
        className={styles.cloudContainer}
        style={{
          transform: `translate(${mousePosition.x * -0.3}px, ${
            mousePosition.y * -0.3
          }px)`,
        }}
      >
        <img src={whcloude.src} alt="" className={styles.cloudImage} />
      </div>

      {/* Flying birds */}
      <div
        className={styles.birdContainer}
        style={{
          transform: `translate(${mousePosition.x * -0.5}px, ${
            mousePosition.y * -0.5
          }px)`,
        }}
      >
        <img src={bird.src} alt="" className={styles.birdImage} />
      </div>

      {/* Connect Button with enhanced effects */}
      <div className={styles.buttonContainer}>
        <button
          onClick={onConnectClick}
          disabled={isConnecting}
          className={`${styles.button} ${
            isConnecting ? styles.buttonDisabled : ""
          }`}
        >
          <ButtonBackground />
          <span className={styles.buttonText}>
            {isConnecting ? "CONNECTING..." : "CONNECT X"}
          </span>
          {isConnecting && <div className={styles.buttonSpinner} />}
        </button>
      </div>
    </div>
  );
};

export default TwitterConnect;
