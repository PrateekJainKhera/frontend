"use client"

import { useState } from 'react'
import { Customer } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { ViewCustomerDialog } from '@/components/dialogs/view-customer-dialog'
import { EditCustomerDialog } from '@/components/dialogs/edit-customer-dialog'

interface CustomersTableProps {
  customers: Customer[]
  onUpdate?: () => void
}

export function CustomersTable({ customers, onUpdate }: CustomersTableProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleView = (customer: Customer) => {
    setSelectedCustomer(customer)
    setViewDialogOpen(true)
  }

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer)
    setEditDialogOpen(true)
  }
  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No customers found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.code}</TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>{customer.contactPerson || '-'}</TableCell>
              <TableCell>{customer.phone || '-'}</TableCell>
              <TableCell className="text-sm">{customer.email || '-'}</TableCell>
              <TableCell>
                <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(customer.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(customer)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      {selectedCustomer && (
        <>
          <ViewCustomerDialog
            customer={selectedCustomer}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditCustomerDialog
            customer={selectedCustomer}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => {
              setEditDialogOpen(false)
              onUpdate?.()
            }}
          />
        </>
      )}
    </div>
  )
}
