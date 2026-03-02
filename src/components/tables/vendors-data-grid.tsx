"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { VendorResponse, vendorService } from '@/lib/api/vendors'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { EditVendorDialog } from '@/components/dialogs/edit-vendor-dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface VendorsDataGridProps {
    vendors: VendorResponse[]
    onUpdate?: () => void
}

const muiTheme = createTheme({
    palette: { mode: 'light' },
    typography: { fontFamily: 'inherit' },
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

export function VendorsDataGrid({ vendors: initialVendors, onUpdate }: VendorsDataGridProps) {
    const [vendors, setVendors] = useState<VendorResponse[]>(initialVendors)
    const [editVendor, setEditVendor] = useState<VendorResponse | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<VendorResponse | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 })

    useMemo(() => { setVendors(initialVendors) }, [initialVendors])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await vendorService.delete(deleteTarget.id)
            toast.success(`"${deleteTarget.vendorName}" deleted`)
            setDeleteTarget(null)
            onUpdate?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete vendor')
        } finally {
            setDeleting(false)
        }
    }

    const columns = useMemo<MRT_ColumnDef<VendorResponse>[]>(() => [
        {
            accessorKey: 'vendorCode',
            header: 'Code',
            size: 100,
            Cell: ({ cell }) => (
                <span className="font-mono font-semibold text-xs">{cell.getValue<string>()}</span>
            ),
        },
        {
            accessorKey: 'vendorName',
            header: 'Vendor Name',
            size: 220,
            Cell: ({ cell }) => <span className="font-medium">{cell.getValue<string>()}</span>,
        },
        {
            accessorKey: 'vendorType',
            header: 'Type',
            size: 120,
            Cell: ({ cell }) => <Badge variant="outline">{cell.getValue<string>()}</Badge>,
        },
        {
            accessorKey: 'contactPerson',
            header: 'Contact Person',
            size: 150,
            Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>() || '—'}</span>,
        },
        {
            accessorKey: 'phone',
            header: 'Phone',
            size: 130,
            Cell: ({ cell }) => <span className="text-sm">{cell.getValue<string>() || '—'}</span>,
        },
        {
            accessorKey: 'city',
            header: 'City',
            size: 120,
            Cell: ({ cell }) => <span className="text-sm text-muted-foreground">{cell.getValue<string>() || '—'}</span>,
        },
        {
            accessorKey: 'gstNo',
            header: 'GST No',
            size: 160,
            Cell: ({ cell }) => (
                <span className="font-mono text-xs text-muted-foreground">{cell.getValue<string>() || '—'}</span>
            ),
        },
        {
            accessorKey: 'isActive',
            header: 'Status',
            size: 90,
            Cell: ({ cell }) => (
                <Badge className={cell.getValue<boolean>() ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
    ], [])

    const table = useMaterialReactTable({
        columns,
        data: vendors,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableSorting: true,
        enableGlobalFilter: false,
        enableTopToolbar: false,
        enableBottomToolbar: true,
        enableRowActions: true,
        positionActionsColumn: 'last',
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
                    onClick={() => setEditVendor(row.original)}
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

            {editVendor && (
                <EditVendorDialog
                    vendor={editVendor}
                    open={!!editVendor}
                    onOpenChange={(open) => { if (!open) setEditVendor(null) }}
                    onSuccess={() => { setEditVendor(null); onUpdate?.() }}
                />
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.vendorName}</strong>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ThemeProvider>
    )
}
