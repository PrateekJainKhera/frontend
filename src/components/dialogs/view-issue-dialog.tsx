'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  PackageCheck,
  Calendar,
  User,
  Ruler,
  Weight,
  Warehouse,
} from 'lucide-react'
import { MaterialIssue } from '@/types/material-issue'
import { format } from 'date-fns'

interface ViewIssueDialogProps {
  open: boolean
  onClose: () => void
  issue: MaterialIssue | null
}

export function ViewIssueDialog({
  open,
  onClose,
  issue,
}: ViewIssueDialogProps) {
  if (!issue) return null

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string }> = {
      'Pending': { className: 'bg-orange-100 text-orange-800 border-orange-300' },
      'Issued': { className: 'bg-green-100 text-green-800 border-green-300' },
      'Returned': { className: 'bg-blue-100 text-blue-800 border-blue-300' },
      'Cancelled': { className: 'bg-gray-100 text-gray-800 border-gray-300' },
    }
    const config = variants[status]
    return <Badge variant="outline" className={config.className}>{status}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-green-600" />
            Material Issue Details - {issue.issueNo}
          </DialogTitle>
          <DialogDescription>
            View complete details of material issue transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getStatusBadge(issue.status)}
          </div>

          {/* Issue Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issue No</p>
                  <p className="font-semibold">{issue.issueNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="font-semibold">
                      {format(new Date(issue.issueDate), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                {issue.confirmedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed At</p>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <p className="font-semibold">
                        {format(new Date(issue.confirmedAt), 'dd MMM yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job Card & Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Job Card & Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Job Card No</p>
                  <p className="font-semibold">{issue.jobCardNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order No</p>
                  <p className="font-semibold">{issue.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requisition No</p>
                  <p className="font-semibold">{issue.requisitionNo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Material Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Material Name</p>
                  <p className="font-semibold">{issue.materialName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <p className="font-semibold">{issue.materialGrade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-semibold">{issue.materialType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Allocation No</p>
                  <p className="font-semibold">{issue.allocationNo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issued Pieces */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issued Pieces</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Piece Number</TableHead>
                    <TableHead>Issued Length</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status Before</TableHead>
                    <TableHead>Status After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issue.pieces.map((piece, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{piece.pieceNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Ruler className="h-3 w-3 text-muted-foreground" />
                          <span>{piece.issuedLength}mm</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Weight className="h-3 w-3 text-muted-foreground" />
                          <span>{piece.weight.toFixed(2)}kg</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          {piece.statusBeforeIssue}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {piece.statusAfterIssue}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Issue Summary */}
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base">Issue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pieces</p>
                  <p className="text-2xl font-bold text-green-700">{issue.totalPieces}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Length</p>
                  <div className="flex items-center justify-center gap-1">
                    <Ruler className="h-4 w-4 text-green-600" />
                    <p className="text-2xl font-bold text-green-700">
                      {(issue.totalIssuedLength / 1000).toFixed(2)}m
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <div className="flex items-center justify-center gap-1">
                    <Weight className="h-4 w-4 text-green-600" />
                    <p className="text-2xl font-bold text-green-700">
                      {issue.totalIssuedWeight.toFixed(2)}kg
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personnel Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Personnel Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Issued By</p>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <p className="font-semibold">{issue.issuedByName}</p>
                  </div>
                </div>
                {issue.receivedByName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Received By</p>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <p className="font-semibold">{issue.receivedByName}</p>
                    </div>
                  </div>
                )}
              </div>

              {issue.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm p-3 bg-gray-50 rounded-md">{issue.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Return Details (if any) */}
          {issue.returnDetails && (
            <Card className="border-blue-300 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base">Return Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Return Date</p>
                    <p className="font-semibold">
                      {format(new Date(issue.returnDetails.returnDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Returned By</p>
                    <p className="font-semibold">{issue.returnDetails.returnedBy}</p>
                  </div>
                  {issue.returnDetails.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Return Notes</p>
                      <p className="text-sm p-2 bg-white rounded-md">{issue.returnDetails.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
