import React, { useState, useRef, useEffect } from "react";
import { Modal } from "./Modal";
import "../style/imageCropper.css";

const VIEWPORT_SIZE = 320; // On-screen viewport size

export const ImageCropperModal = ({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  outputSize = 500,
  quality = 0.9,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startOffsetRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);

  // Load image dimensions when imageSrc changes
  useEffect(() => {
    if (!imageSrc || !isOpen) {
      setImgLoaded(false);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImgLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc, isOpen]);

  // Compute base scale to cover viewport
  const baseScale = imgLoaded
    ? Math.max(VIEWPORT_SIZE / imgDimensions.width, VIEWPORT_SIZE / imgDimensions.height)
    : 1;

  const currentScale = baseScale * zoom;
  const dispW = imgDimensions.width * currentScale;
  const dispH = imgDimensions.height * currentScale;

  // Clamp offsets to keep viewport covered
  const maxOffsetX = Math.max(0, (dispW - VIEWPORT_SIZE) / 2);
  const maxOffsetY = Math.max(0, (dispH - VIEWPORT_SIZE) / 2);

  const clampedX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x));
  const clampedY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y));

  // Top-Left position within viewport
  const leftPos = (VIEWPORT_SIZE - dispW) / 2 + clampedX;
  const topPos = (VIEWPORT_SIZE - dispH) / 2 + clampedY;

  // Pointer event handlers for smooth dragging
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startPosRef.current = { x: clientX, y: clientY };
    startOffsetRef.current = { x: offset.x, y: offset.y };
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;

    const newX = startOffsetRef.current.x + deltaX;
    const newY = startOffsetRef.current.y + deltaY;

    setOffset({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, prev + zoomDelta)));
  };

  // Perform 500x500 crop extraction onto canvas at 0.9 quality
  const handleApplyCrop = () => {
    if (!imgLoaded) return;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const img = new Image();
    img.onload = () => {
      // Calculate source crop rectangle on natural image
      const sx = (0 - leftPos) / currentScale;
      const sy = (0 - topPos) / currentScale;
      const sw = VIEWPORT_SIZE / currentScale;
      const sh = VIEWPORT_SIZE / currentScale;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outputSize, outputSize);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;

          const croppedFile = new File([blob], `avatar-${outputSize}x${outputSize}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          const dataUrl = canvas.toDataURL("image/jpeg", quality);

          if (onCropComplete) {
            onCropComplete({ file: croppedFile, blob, dataUrl });
          }
          onClose();
        },
        "image/jpeg",
        quality
      );
    };
    img.src = imageSrc;
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crop Profile Photo">
      <div className="cropper-container">
        <div
          className="cropper-viewport-wrapper"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onWheel={handleWheel}
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop selection"
              className="cropper-img"
              style={{
                width: `${dispW}px`,
                height: `${dispH}px`,
                transform: `translate3d(${leftPos}px, ${topPos}px, 0px)`,
              }}
            />
          )}
          <div className="cropper-overlay-grid" />
        </div>

        <div className="cropper-controls">
          <div className="cropper-slider-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="cropper-slider"
            />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <p className="cropper-hint">Drag image to position • Scroll or slider to zoom</p>
        </div>

        <div className="form-actions" style={{ width: "100%", justifyContent: "flex-end" }}>
          <button type="button" className="profile-btn profile-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="profile-btn profile-btn--primary" onClick={handleApplyCrop}>
            Apply 500x500 Crop
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropperModal;
