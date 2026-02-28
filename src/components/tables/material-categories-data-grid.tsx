"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { MaterialCategoryResponse, materialCategoryService } from '@/lib/api/material-categories'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface MaterialCategoriesDataGridProps {
    categories: MaterialCategoryResponse[]
    onUpdate?: () => void
}

// MUI Theme matching app styles
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

export function MaterialCategoriesDataGrid({ categories, onUpdate }: MaterialCategoriesDataGridProps) {
    const [deleteTarget, setDeleteTarget] = useState<MaterialCategoryResponse | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await materialCategoryService.delete(deleteTarget.id)
            toast.success(`"${deleteTarget.categoryName}" deleted`)
            setDeleteTarget(null)
            onUpdate?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete category')
        } finally {
            setDeleting(false)
        }
    }

    // Define columns
    const columns = useMemo<MRT_ColumnDef<MaterialCategoryResponse>[]>(
        () => [
            {
                accessorKey: 'categoryCode',
                header: 'Code',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'categoryName',
                header: 'Category Name',
                size: 180,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'quality',
                header: 'Quality',
                size: 100,
            },
            {
                accessorKey: 'description',
                header: 'Description',
                size: 200,
                Cell: ({ cell }) => (
                    <span className="truncate max-w-[200px] block">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'defaultUOM',
                header: 'UOM',
                size: 80,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()?.toUpperCase()}</Badge>
                ),
            },
            {
                accessorKey: 'materialType',
                header: 'Type',
                size: 120,
                Cell: ({ cell }) => (
                    <Badge variant={cell.getValue<string>() === 'raw_material' ? 'default' : 'secondary'}>
                        {cell.getValue<string>() === 'raw_material' ? 'Raw Material' : 'Component'}
                    </Badge>
                ),
            },
            {
                accessorKey: 'isActive',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => (
                    <Badge variant={cell.getValue<boolean>() ? 'default' : 'destructive'}>
                        {cell.getValue<boolean>() ? 'Active' : 'Inactive'}
                    </Badge>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: categories,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableSorting: true,
        enableGlobalFilter: false,
        enableTopToolbar: false,
        enableBottomToolbar: true,
        enableRowActions: true,
        positionActionsColumn: 'last',

        // Enable Column Reordering
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
                <Link href={`/masters/material-categories/${row.original.id}`}>
                    <Button variant="ghost" size="icon" title="View">
                        <Eye className="h-4 w-4" />
                    </Button>
                </Link>
                <Link href={`/masters/material-categories/${row.original.id}/edit`}>
                    <Button variant="ghost" size="icon" title="Edit">
                        <Edit className="h-4 w-4" />
                    </Button>
                </Link>
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

            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.categoryName}</strong>? This cannot be undone.
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
