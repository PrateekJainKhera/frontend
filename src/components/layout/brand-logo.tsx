'use client'

import { useState } from 'react'

/**
 * Renders the Multi Hitech Inc. logo from /public/multihitech-logo.jpeg.
 * If the image is missing (not yet added), it renders the provided `fallback`
 * so the UI never looks broken.
 */
export function BrandLogo({
  className,
  alt = 'Multi Hitech Inc.',
  fallback,
}: {
  className?: string
  alt?: string
  fallback: React.ReactNode
}) {
  const [err, setErr] = useState(false)
  if (err) return <>{fallback}</>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/multihitech-logo.jpeg"
      alt={alt}
      className={className}
      onError={() => setErr(true)}
    />
  )
}
