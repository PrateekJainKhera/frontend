'use client'

import { useEffect, useState } from 'react'
import { X, FileText, ZoomIn, ZoomOut, Download } from 'lucide-react'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="mt-1">{description}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {file && (
                <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
              )}
              <Badge variant="outline">
                {isPDF ? 'PDF' : isImage ? ext.toUpperCase() : ext.toUpperCase() || 'FILE'}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Controls */}
        {isImage && (
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(25, zoom - 25))}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(100)}
                disabled={zoom === 100}
              >
                Reset
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-50 rounded-lg border">
          {!file && !url ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No file selected</p>
            </div>
          ) : isPDF ? (
            <iframe
              src={previewUrl || ''}
              className="w-full h-full"
              title={title}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-full p-4">
              <img
                src={previewUrl || ''}
                alt={title}
                style={{
                  width: `${zoom}%`,
                  maxWidth: 'none',
                  height: 'auto'
                }}
                className="shadow-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">Preview not available for this file type</p>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* File Info Footer */}
        {(file || url) && (
          <div className="border-t pt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-medium">{file?.name || title}</span>
            {file && <span>Last modified: {new Date(file.lastModified).toLocaleString()}</span>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
