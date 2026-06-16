'use client'

import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'

interface ImageZoomProps {
  src: string
  alt?: string
  width?: number
  height?: number
  className?: string
}

export function ImageZoom({ src, alt, width, height, className }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const toggleZoom = () => setIsOpen(!isOpen)

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', handleEsc)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  const overlay = isOpen && mounted ? (
    <div
      className="image-zoom-overlay"
      onClick={toggleZoom}
    >
      <div className="image-zoom-container">
        <img
          src={src}
          alt={alt}
          className="image-zoom-full"
        />
      </div>
      <button className="image-zoom-close" onClick={toggleZoom}>
        &times;
      </button>
    </div>
  ) : null

  return (
    <>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} cursor-zoom-in`}
        onClick={toggleZoom}
        style={{ cursor: 'zoom-in' }}
      />
      {mounted && ReactDOM.createPortal(overlay, document.body)}
    </>
  )
}
