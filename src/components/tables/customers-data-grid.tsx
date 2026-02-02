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
import { Edit, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { ViewCustomerDialog } from '@/components/dialogs/view-customer-dialog'
import { EditCustomerDialog } from '@/components/dialogs/edit-customer-dialog'

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
        </ThemeProvider>
    )
}
