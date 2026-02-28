"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ComponentResponse } from '@/lib/api/components'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { ViewComponentDialog } from '@/components/dialogs/view-component-dialog'
import { EditComponentDialog } from '@/components/dialogs/edit-component-dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { componentService } from '@/lib/api/components'
import { toast } from 'sonner'

interface ComponentsDataGridProps {
    components: ComponentResponse[]
    onUpdate?: () => void
}

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Bearing':
            return 'bg-blue-100 text-blue-700'
        case 'Gear':
            return 'bg-purple-100 text-purple-700'
        case 'Seal':
            return 'bg-green-100 text-green-700'
        case 'Coupling':
            return 'bg-amber-100 text-amber-700'
        case 'Shaft':
            return 'bg-gray-100 text-gray-700'
        case 'Bushing':
            return 'bg-cyan-100 text-cyan-700'
        case 'Fastener':
            return 'bg-pink-100 text-pink-700'
        default:
            return 'bg-slate-100 text-slate-700'
    }
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

export function ComponentsDataGrid({ components, onUpdate }: ComponentsDataGridProps) {
    const [data, setData] = useState<ComponentResponse[]>(components)
    const [selectedComponent, setSelectedComponent] = useState<ComponentResponse | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ComponentResponse | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Sync prop to internal state
    useMemo(() => {
        setData(components)
    }, [components])

    const handleView = (component: ComponentResponse) => {
        setSelectedComponent(component)
        setViewDialogOpen(true)
    }

    const handleEdit = (component: ComponentResponse) => {
        setSelectedComponent(component)
        setEditDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await componentService.delete(deleteTarget.id)
            toast.success(`"${deleteTarget.componentName}" deleted`)
            setDeleteTarget(null)
            onUpdate?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete component')
        } finally {
            setDeleting(false)
        }
    }

    // Define columns - Masters only (no inventory fields)
    const columns = useMemo<MRT_ColumnDef<ComponentResponse>[]>(
        () => [
            {
                accessorKey: 'partNumber',
                header: 'Part Number',
                size: 120,
                Cell: ({ cell }) => (
                    <span className="font-mono font-semibold">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'componentName',
                header: 'Component Name',
                size: 220,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'category',
                header: 'Category',
                size: 120,
                Cell: ({ cell }) => (
                    <Badge className={getCategoryColor(cell.getValue<string>())}>
                        {cell.getValue<string>()}
                    </Badge>
                ),
            },
            {
                accessorKey: 'manufacturer',
                header: 'Manufacturer',
                size: 150,
                Cell: ({ cell }) => (
                    <span className="text-sm">{cell.getValue<string>() || '-'}</span>
                ),
            },
            {
                accessorKey: 'supplierName',
                header: 'Supplier',
                size: 150,
                Cell: ({ cell }) => (
                    <span className="text-sm text-muted-foreground">
                        {cell.getValue<string>() || '-'}
                    </span>
                ),
            },
            {
                accessorKey: 'unit',
                header: 'Unit',
                size: 80,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()}</Badge>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: data,
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

            {selectedComponent && (
                <>
                    <ViewComponentDialog
                        component={selectedComponent}
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                    />
                    <EditComponentDialog
                        component={selectedComponent}
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
                        <AlertDialogTitle>Delete Component?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.componentName}</strong>? This cannot be undone.
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
