"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { MaterialResponse } from '@/lib/api/materials'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Trash2 } from 'lucide-react'
import { ViewRawMaterialDialog } from '@/components/dialogs/view-raw-material-dialog'
import { EditRawMaterialDialog } from '@/components/dialogs/edit-raw-material-dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { materialService } from '@/lib/api/materials'
import { toast } from 'sonner'

interface RawMaterialsDataGridProps {
    materials: MaterialResponse[]
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

export function RawMaterialsDataGrid({ materials, onUpdate }: RawMaterialsDataGridProps) {
    const [data, setData] = useState<MaterialResponse[]>(materials)
    const [selectedMaterial, setSelectedMaterial] = useState<MaterialResponse | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<MaterialResponse | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    // Sync prop to internal state
    useMemo(() => {
        setData(materials)
    }, [materials])

    const handleView = (material: MaterialResponse) => {
        setSelectedMaterial(material)
        setViewDialogOpen(true)
    }

    const handleEdit = (material: MaterialResponse) => {
        setSelectedMaterial(material)
        setEditDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await materialService.delete(deleteTarget.id)
            toast.success(`"${deleteTarget.materialName}" deleted`)
            setDeleteTarget(null)
            onUpdate?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete material')
        } finally {
            setDeleting(false)
        }
    }

    // Define columns
    const columns = useMemo<MRT_ColumnDef<MaterialResponse>[]>(
        () => [
            {
                accessorKey: 'materialName',
                header: 'Material Name',
                size: 180,
                Cell: ({ cell }) => (
                    <span className="font-medium">{cell.getValue<string>()}</span>
                ),
            },
            {
                accessorKey: 'materialType',
                header: 'Type',
                size: 120,
                Cell: ({ cell }) => (
                    <Badge variant="secondary">{cell.getValue<string>()}</Badge>
                ),
            },
            {
                accessorKey: 'grade',
                header: 'Grade',
                size: 100,
                Cell: ({ cell }) => (
                    <Badge variant="outline">{cell.getValue<string>()}</Badge>
                ),
            },
            {
                accessorKey: 'shape',
                header: 'Shape',
                size: 100,
            },
            {
                header: 'Dimensions',
                size: 140,
                Cell: ({ row }) => {
                    const { shape, diameter, innerDiameter, width } = row.original
                    if (shape === 'Pipe') return <span className="text-sm">⌀{diameter} / ID:{innerDiameter}mm</span>
                    if (shape === 'Sheet') return <span className="text-sm">W:{width}mm</span>
                    return <span className="text-sm">⌀{diameter}mm</span>
                },
            },
            {
                accessorKey: 'density',
                header: 'Density',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="text-sm">{cell.getValue<number>()} g/cm³</span>
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

            {selectedMaterial && (
                <>
                    <ViewRawMaterialDialog
                        material={selectedMaterial}
                        open={viewDialogOpen}
                        onOpenChange={setViewDialogOpen}
                    />
                    <EditRawMaterialDialog
                        material={selectedMaterial}
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
                        <AlertDialogTitle>Delete Material?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.materialName}</strong>? This cannot be undone.
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
