'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { FileText, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DrawingPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file?: File | null
  url?: string | null   // direct server URL — alternative to file
  title: string
  description?: string
}

export function DrawingPreviewDialog({
  open,
  onOpenChange,
  file,
  url,
  title,
  description
}: DrawingPreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)          // 0 / 90 / 180 / 270
  const areaRef = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (file) {
      const blobUrl = URL.createObjectURL(file)
      setPreviewUrl(blobUrl)
      return () => { URL.revokeObjectURL(blobUrl) }
    } else if (url) {
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [file, url])

  // Reset view each time a new file/dialog opens
  useEffect(() => { if (open) { setZoom(100); setRotation(0) } }, [open, file, url])

  // Track the preview area size so a rotated iframe/image can be sized to fill it
  useEffect(() => {
    if (!open) return
    const el = areaRef.current
    if (!el) return
    const measure = () => setArea({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [open, previewUrl])

  const handleDownload = () => {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = file?.name || title
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Detect type: prefer file MIME, fall back to extension from URL
  const ext = (file?.name || url || '').split('.').pop()?.toLowerCase() ?? ''
  const isPDF = file ? file.type === 'application/pdf' : ext === 'pdf'
  const isImage = file ? file.type.startsWith('image/') : ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)

  const rotated = rotation % 180 !== 0
  // When rotated 90/270 the element's width/height swap, so size it to the area's opposite axis.
  const rotatedStyle: CSSProperties = rotated
    ? { width: area.h, height: area.w, transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        position: 'absolute', top: '50%', left: '50%' }
    : { width: '100%', height: '100%' }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none sm:max-w-none rounded-none flex flex-col p-4">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DialogTitle className="flex items-center gap-2 truncate">
                <FileText className="h-5 w-5 shrink-0" />
                <span className="truncate">{title}</span>
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {file && (
                <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
              )}
              <Badge variant="outline">
                {isPDF ? 'PDF' : isImage ? ext.toUpperCase() : ext.toUpperCase() || 'FILE'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Controls — rotate (all), zoom (image), download */}
        {(isPDF || isImage) && (
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)} title="Rotate 90°">
                <RotateCw className="h-4 w-4 mr-1.5" /> Rotate
              </Button>
              {isImage && (
                <>
                  <span className="mx-1 h-5 w-px bg-border" />
                  <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))} disabled={zoom <= 25}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[52px] text-center">{zoom}%</span>
                  <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(400, zoom + 25))} disabled={zoom >= 400}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setZoom(100); setRotation(0) }} disabled={zoom === 100 && rotation === 0}>
                    Reset
                  </Button>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        )}

        {/* Preview Area */}
        <div ref={areaRef} className="relative flex-1 overflow-auto bg-gray-100 rounded-lg border">
          {!file && !url ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No file selected</p>
            </div>
          ) : isPDF ? (
            <iframe
              // #view=FitH tells the browser's built-in PDF viewer to fit the page to the
              // viewer's width on open, instead of its default "actual size" zoom — without
              // this a portrait drawing sheet renders small and centered, needing manual zoom.
              src={previewUrl ? `${previewUrl}#view=FitH` : ''}
              title={title}
              style={rotatedStyle}
              className="border-0"
            />
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={previewUrl || ''}
                alt={title}
                style={{
                  transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
                  transformOrigin: 'center',
                  maxWidth: rotated ? 'none' : '100%',
                  maxHeight: rotated ? 'none' : '100%',
                }}
                className="shadow-lg transition-transform"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Preview not available for this file type</p>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* File Info Footer */}
        {(file || url) && (
          <div className="border-t pt-2 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium truncate">{file?.name || title}</span>
            {file && <span className="shrink-0 ml-3">{new Date(file.lastModified).toLocaleString()}</span>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
