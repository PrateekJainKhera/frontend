"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Customer } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { ViewCustomerDialog } from '@/components/dialogs/view-customer-dialog'
import { EditCustomerDialog } from '@/components/dialogs/edit-customer-dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { customerService } from '@/lib/api/customer'
import { toast } from 'sonner'

interface CustomersDataGridProps {
    customers: Customer[]
    onUpdate?: () => void
}

// Create a theme that matches our app
const muiTheme = createTheme({
    palette: {
        mode: 'light',
    },
    typography: {
        fontFamily: 'inherit',
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: 'none',
                    border: '2px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    '& .MuiTableCell-head': {
                        backgroundColor: 'hsl(var(--muted))',
                        fontWeight: 600,
                    },
                },
            },
        },
    },
})

export function CustomersDataGrid({ customers: initialCustomers, onUpdate }: CustomersDataGridProps) {
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Update customers when prop changes
    useMemo(() => {
        setCustomers(initialCustomers)
    }, [initialCustomers])

    const handleView = (customer: Customer) => {
        setSelectedCustomer(customer)
        setViewDialogOpen(true)
    }

    const handleEdit = (customer: Customer) => {
        setSelectedCustomer(customer)
        setEditDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await customerService.delete(deleteTarget.id)
            toast.success(`"${deleteTarget.customerName}" deleted`)
            setDeleteTarget(null)
            onUpdate?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete customer')
        } finally {
            setDeleting(false)
        }
    }

    // Define columns
    const columns = useMemo<MRT_ColumnDef<Customer>[]>(
        () => [
            {
                accessorKey: 'customerCode',
                header: 'Code',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'customerName',
                header: 'Name',
                size: 200,
            },
            {
                accessorKey: 'contactPerson',
                header: 'Contact Person',
                size: 150,
                Cell: ({ cell }) => cell.getValue<string>() || '-',
            },
            {
                accessorKey: 'phone',
                header: 'Phone',
                size: 120,
                Cell: ({ cell }) => cell.getValue<string>() || '-',
            },
            {
                accessorKey: 'email',
                header: 'Email',
                size: 180,
                Cell: ({ cell }) => (
                    <span className="text-sm">{cell.getValue<string>() || '-'}</span>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => (
                    <Badge variant={cell.getValue<boolean>() ? 'default' : 'secondary'}>
                        {cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
            {
                accessorKey: 'createdAt',
                header: 'Created',
                size: 120,
                Cell: ({ cell }) => (
                    <span className="text-sm text-muted-foreground">
                        {formatDate(new Date(cell.getValue<string>()))}
                    </span>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: customers,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableSorting: true,
        enableGlobalFilter: false,
        enableTopToolbar: false,
        enableBottomToolbar: true,
        enableRowActions: true,
        positionActionsColumn: 'last',

        // Enable Column Reordering (Drag Column Headers)
        enableColumnOrdering: true,

        onPaginationChange: setPagination,
        state: { pagination },
        muiPaginationProps: {
            rowsPerPageOptions: [10, 25, 50],
            showFirstButton: true,
            showLastButton: true,
        },
        paginationDisplayMode: 'pages',

        renderRowActions: ({ row }) => (
            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleView(row.original)}
                    title="View"
                >
                    <Eye className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(row.original)}
                    title="Edit"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(row.original)}
                    title="Delete"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        ),
    })

    return (
        <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />

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
            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.customerName}</strong>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ThemeProvider>
    )
}
