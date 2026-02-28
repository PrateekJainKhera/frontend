"use client"

import { useState } from 'react'
import { MaterialPieceResponse, materialPieceService } from '@/lib/api/material-pieces'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'

interface AdjustPieceLengthDialogProps {
  piece: MaterialPieceResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AdjustPieceLengthDialog({
  piece,
  open,
  onOpenChange,
  onSuccess,
}: AdjustPieceLengthDialogProps) {
  const [newLength, setNewLength] = useState<string>(String(piece.currentLengthMM))
  const [remark, setRemark] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const newLengthNum = parseFloat(newLength) || 0
  const diff = newLengthNum - piece.currentLengthMM
  const diffLabel = diff === 0 ? '' : diff > 0 ? `+${diff.toFixed(1)} mm` : `${diff.toFixed(1)} mm`

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewLength(String(piece.currentLengthMM))
      setRemark('')
    }
    onOpenChange(open)
  }

  const handleSubmit = async () => {
    if (newLengthNum <= 0) { toast.error('New length must be greater than 0'); return }
    if (remark.trim().length < 3) { toast.error('Remark must be at least 3 characters'); return }

    setIsSubmitting(true)
    try {
      await materialPieceService.adjustLength(piece.id, newLengthNum, remark.trim())
      toast.success(`Length updated: ${piece.currentLengthMM} mm → ${newLengthNum} mm`)
      onSuccess()
      handleOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adjust length')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Piece Length</DialogTitle>
          <DialogDescription>
            Correct the actual length of this inventory piece. Weight will be recalculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Piece info */}
          <div className="bg-muted/40 rounded-md p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Piece No</span>
              <span className="font-medium">{piece.pieceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Material</span>
              <span className="font-medium">{piece.materialName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Length (system)</span>
              <span className="font-semibold text-blue-700">{piece.currentLengthMM} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Original Length</span>
              <span>{piece.originalLengthMM} mm</span>
            </div>
          </div>

          {/* New length input */}
          <div className="space-y-1.5">
            <Label htmlFor="new-length">
              Actual Length (mm) <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-length"
                type="number"
                min={1}
                step={1}
                value={newLength}
                onChange={e => setNewLength(e.target.value)}
                className="w-36"
                placeholder="e.g. 500"
              />
              {diffLabel && (
                <span className={`text-xs font-medium ${diff < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {diffLabel}
                </span>
              )}
            </div>
          </div>

          {/* Remark */}
          <div className="space-y-1.5">
            <Label htmlFor="remark">
              Reason / Remark <span className="text-destructive">*</span>
            </Label>
            <Input
              id="remark"
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="e.g. Wrong entry at receiving"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>This correction is recorded with your remark. It cannot be undone from the UI.</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || newLengthNum <= 0 || remark.trim().length < 3}>
            {isSubmitting ? 'Saving...' : 'Save Correction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
