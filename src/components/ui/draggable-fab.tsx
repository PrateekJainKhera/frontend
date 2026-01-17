"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

interface DraggableFabProps {
  children: React.ReactNode
  onClick: () => void
  storageKey?: string
  className?: string
}

export function DraggableFab({
  children,
  onClick,
  storageKey = 'fab-position',
  className
}: DraggableFabProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Load saved position from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        const { x, y } = JSON.parse(saved)
        setPosition({ x, y })
      } catch (e) {
        // If parsing fails, use default position
        const defaultPos = getDefaultPosition()
        setPosition(defaultPos)
      }
    } else {
      const defaultPos = getDefaultPosition()
      setPosition(defaultPos)
    }
  }, [storageKey])

  // Get default position (bottom-right corner)
  const getDefaultPosition = () => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    return {
      x: window.innerWidth - 100, // 100px from right
      y: window.innerHeight - 100  // 100px from bottom
    }
  }

  // Save position to localStorage
  const savePosition = (pos: { x: number; y: number }) => {
    localStorage.setItem(storageKey, JSON.stringify(pos))
  }

  // Handle mouse down - start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  // Handle touch start - start dragging on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    })
  }

  // Handle mouse/touch move
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y

      // Constrain to viewport bounds
      const maxX = window.innerWidth - 56 // 56px is button width
      const maxY = window.innerHeight - 56

      const constrainedX = Math.max(0, Math.min(newX, maxX))
      const constrainedY = Math.max(0, Math.min(newY, maxY))

      setPosition({ x: constrainedX, y: constrainedY })
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.x
      const newY = touch.clientY - dragStart.y

      // Constrain to viewport bounds
      const maxX = window.innerWidth - 56
      const maxY = window.innerHeight - 56

      const constrainedX = Math.max(0, Math.min(newX, maxX))
      const constrainedY = Math.max(0, Math.min(newY, maxY))

      setPosition({ x: constrainedX, y: constrainedY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      savePosition(position)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging, dragStart, position])

  // Handle click - only trigger if not dragged
  const handleClick = (e: React.MouseEvent) => {
    // If we just finished dragging, don't trigger onClick
    if (isDragging) {
      e.preventDefault()
      return
    }
    onClick()
  }

  return (
    <Button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className={cn(
        "fixed h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow cursor-move",
        isDragging && "cursor-grabbing shadow-2xl scale-110",
        className
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      size="icon"
    >
      {children}
    </Button>
  )
}
