import React from "react";
import styles from "./Loader.module.css";

const SunLoader = () => {
  return (
    <>
      <div className={styles.sunWrapper}>
        <img src="/sun.png" alt="Sun" className={styles.sunImage} />
        <div className={styles.sunGlow}></div>
        <div className={styles.sunFlare}></div>
      </div>
      <div className={styles.sunRays}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={styles.sunRay}
            style={{
              transform: `rotate(${i * 30}deg)`,
              animationDelay: `${i * 0.2}s`,
            }}
          ></div>
        ))}
      </div>
      <div className={styles.coreGlow}></div>
      <div className={styles.orbit}>
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={styles.orbitParticle}
            style={{
              transform: `rotate(${i * 45}deg) translateX(60px)`,
              animationDelay: `${i * 0.15}s`,
            }}
          ></div>
        ))}
      </div>
    </>
  );
};

export default SunLoader;
