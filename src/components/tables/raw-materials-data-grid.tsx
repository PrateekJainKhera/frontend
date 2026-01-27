"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { RawMaterial } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye } from 'lucide-react'
import { ViewRawMaterialDialog } from '@/components/dialogs/view-raw-material-dialog'
import { EditRawMaterialDialog } from '@/components/dialogs/edit-raw-material-dialog'

interface RawMaterialsDataGridProps {
    materials: RawMaterial[]
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
    const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })

    const handleView = (material: RawMaterial) => {
        setSelectedMaterial(material)
        setViewDialogOpen(true)
    }

    const handleEdit = (material: RawMaterial) => {
        setSelectedMaterial(material)
        setEditDialogOpen(true)
    }

    // Define columns
    const columns = useMemo<MRT_ColumnDef<RawMaterial>[]>(
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
                accessorKey: 'diameter',
                header: 'Diameter',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="text-sm">⌀{cell.getValue<number>()}mm</span>
                ),
            },
            {
                accessorKey: 'lengthInMM',
                header: 'Length',
                size: 100,
                Cell: ({ cell }) => (
                    <span className="text-sm">{cell.getValue<number>()}mm</span>
                ),
            },
            {
                accessorKey: 'weightKG',
                header: 'Weight/Unit',
                size: 120,
                Cell: ({ cell }) => (
                    <span className="font-mono text-sm">
                        {cell.getValue<number>()?.toFixed(2)} kg
                    </span>
                ),
            },
        ],
        []
    )

    const table = useMaterialReactTable({
        columns,
        data: materials,
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
            </div>
        ),
    })

    return (
        <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />

            {/* Dialogs */}
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
        </ThemeProvider>
    )
}
