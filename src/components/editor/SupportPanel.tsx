"use client";

import { useCallback } from "react";
import { RiCloseLine, RiFileCopyLine } from "@remixicon/react";

interface SupportPanelProps {
  open: boolean;
  onClose: () => void;
}

function showToast(message: string) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

export default function SupportPanel({ open, onClose }: SupportPanelProps) {
  const copyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address).then(() => {
      showToast("Copied!");
    });
  }, []);

  const handleShare = useCallback(() => {
    const text = encodeURIComponent(
      "Check out Baseline — a free grid generator for designers. https://baseline.is",
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
  }, []);

  return (
    <>
      {/* Overlay */}
      <div
        className={`donation-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`donation-panel ${open ? "open" : ""}`}>
        <div className="donation-panel-header">
          <h2>Support Baseline</h2>
          <button className="donation-close" onClick={onClose}>
            <RiCloseLine size={20} />
          </button>
        </div>
        <div className="donation-content">
          <div className="donation-message">
            Hey there! 👋
            <br />
            <br />
            Thanks for using Baseline. If it&apos;s saved you time or made your
            design workflow easier, consider a small donation.
            <br />
            <br />
            Every bit helps keep this project alive and improving. ✨
          </div>

          {/* Solana */}
          <div className="wallet-card">
            <div className="wallet-header">
              <div className="wallet-icon">
                <svg viewBox="0 0 128 128" fill="none">
                  <circle cx="64" cy="64" r="64" fill="url(#solGrad)" />
                  <path
                    d="M35.5 80.5L47.3 68.7C48.1 67.9 49.2 67.5 50.3 67.5H92.5C93.4 67.5 93.8 68.6 93.2 69.2L81.4 81C80.6 81.8 79.5 82.2 78.4 82.2H36.2C35.3 82.2 34.9 81.1 35.5 80.5Z"
                    fill="white"
                  />
                  <path
                    d="M35.5 47.5L47.3 59.3C48.1 60.1 49.2 60.5 50.3 60.5H92.5C93.4 60.5 93.8 59.4 93.2 58.8L81.4 47C80.6 46.2 79.5 45.8 78.4 45.8H36.2C35.3 45.8 34.9 46.9 35.5 47.5Z"
                    fill="white"
                  />
                  <path
                    d="M92.5 53.5H50.3C49.2 53.5 48.1 53.9 47.3 54.7L35.5 66.5C34.9 67.1 35.3 68.2 36.2 68.2H78.4C79.5 68.2 80.6 67.8 81.4 67L93.2 55.2C93.8 54.6 93.4 53.5 92.5 53.5Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="wallet-name">Solana</div>
            </div>
            <div className="wallet-address">
              HCvLdXCkmN4CFMwjPYAuvdLduNJYP53ziiQuCYiKdzkJ
            </div>
            <div className="wallet-actions">
              <button
                className="wallet-btn copy"
                onClick={() =>
                  copyAddress(
                    "HCvLdXCkmN4CFMwjPYAuvdLduNJYP53ziiQuCYiKdzkJ",
                  )
                }
              >
                <RiFileCopyLine size={14} />
                Copy
              </button>
            </div>
          </div>

          {/* Ethereum */}
          <div className="wallet-card">
            <div className="wallet-header">
              <div className="wallet-icon">
                <svg viewBox="0 0 128 128" fill="none">
                  <circle cx="64" cy="64" r="64" fill="#627EEA" />
                  <path
                    d="M64 16V52.66L93.86 65.06L64 16Z"
                    fill="white"
                    fillOpacity="0.6"
                  />
                  <path d="M64 16L34.14 65.06L64 52.66V16Z" fill="white" />
                  <path
                    d="M64 87.46V112L93.88 71.16L64 87.46Z"
                    fill="white"
                    fillOpacity="0.6"
                  />
                  <path d="M64 112V87.46L34.14 71.16L64 112Z" fill="white" />
                  <path
                    d="M64 81.36L93.86 65.06L64 52.68V81.36Z"
                    fill="white"
                    fillOpacity="0.2"
                  />
                  <path
                    d="M34.14 65.06L64 81.36V52.68L34.14 65.06Z"
                    fill="white"
                    fillOpacity="0.6"
                  />
                </svg>
              </div>
              <div className="wallet-name">Ethereum</div>
            </div>
            <div className="wallet-address">
              0x35ccffF3e9bA23EA6FD6030aE24C4fc7032E23d1
            </div>
            <div className="wallet-actions">
              <button
                className="wallet-btn copy"
                onClick={() =>
                  copyAddress(
                    "0x35ccffF3e9bA23EA6FD6030aE24C4fc7032E23d1",
                  )
                }
              >
                <RiFileCopyLine size={14} />
                Copy
              </button>
            </div>
          </div>

          {/* Bitcoin */}
          <div className="wallet-card">
            <div className="wallet-header">
              <div className="wallet-icon">
                <svg viewBox="0 0 128 128" fill="none">
                  <circle cx="64" cy="64" r="64" fill="#F7931A" />
                  <path
                    d="M89.5 55.5C90.6 47.3 84.5 42.9 76 40L78.6 29.5L72.1 27.9L69.6 38.1C67.9 37.7 66.1 37.3 64.4 36.9L66.9 26.6L60.4 25L57.8 35.5C56.4 35.2 55 34.9 53.7 34.5L46.1 32.6L44.4 39.5C44.4 39.5 49.2 40.6 49.1 40.7C51.8 41.4 52.3 43.1 52.2 44.5L49.1 57C49.3 57 49.5 57.1 49.8 57.2L49.1 57L44.7 75.4C44.4 76.2 43.5 77.4 41.6 76.9C41.7 77 36.9 75.8 36.9 75.8L33.5 83.2L40.6 85C42.2 85.4 43.7 85.8 45.2 86.2L42.6 96.9L49.1 98.5L51.7 87.9C53.5 88.4 55.2 88.8 56.9 89.2L54.3 99.7L60.8 101.3L63.4 90.6C74.4 92.7 82.7 91.8 86.1 81.9C88.8 73.9 85.8 69.3 80 66.4C84.3 65.4 87.5 62.5 88.4 57.1L89.5 55.5ZM73.6 77.5C71.7 85.5 58 81.1 53.6 80L57.1 65.8C61.5 66.9 75.6 69 73.6 77.5ZM75.5 55.4C73.8 62.7 62.5 59 58.8 58L62 45.1C65.7 46.1 77.3 47.7 75.5 55.4Z"
                    fill="white"
                  />
                </svg>
              </div>
              <div className="wallet-name">Bitcoin</div>
            </div>
            <div className="wallet-address">
              bc1qwsr58r24ckt2dc0p2aa2qc8gp6punt7t4tdsea
            </div>
            <div className="wallet-actions">
              <button
                className="wallet-btn copy"
                onClick={() =>
                  copyAddress(
                    "bc1qwsr58r24ckt2dc0p2aa2qc8gp6punt7t4tdsea",
                  )
                }
              >
                <RiFileCopyLine size={14} />
                Copy
              </button>
            </div>
          </div>

          <div className="share-section">
            <p>Not able to donate? Sharing helps too!</p>
            <button className="share-btn" onClick={handleShare}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </button>
          </div>
        </div>
      </div>

      {/* SVG gradient defs for Solana icon */}
      <svg className="svg-defs" aria-hidden="true">
        <defs>
          <linearGradient
            id="solGrad"
            x1="0"
            y1="0"
            x2="128"
            y2="128"
          >
            <stop stopColor="#9945FF" />
            <stop offset="1" stopColor="#14F195" />
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}
