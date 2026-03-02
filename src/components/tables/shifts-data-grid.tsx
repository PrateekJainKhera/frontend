"use client"

import { useMemo, useState } from 'react'
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_PaginationState,
} from 'material-react-table'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Shift } from '@/types/shift'
import { shiftService } from '@/lib/api/shifts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface ShiftsDataGridProps {
    shifts: Shift[]
    onEdit: (shift: Shift) => void
    onUpdate: () => void
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

export function ShiftsDataGrid({ shifts: initialShifts, onEdit, onUpdate }: ShiftsDataGridProps) {
    const [shifts, setShifts] = useState<Shift[]>(initialShifts)
    const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 })

    useMemo(() => { setShifts(initialShifts) }, [initialShifts])

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            await shiftService.delete(deleteTarget.id)
            toast.success(`"${deleteTarget.shiftName}" deleted`)
            setDeleteTarget(null)
            onUpdate()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete shift')
        } finally {
            setDeleting(false)
        }
    }

    const columns = useMemo<MRT_ColumnDef<Shift>[]>(() => [
        {
            accessorKey: 'shiftName',
            header: 'Shift Name',
            size: 160,
            Cell: ({ cell }) => <span className="font-semibold">{cell.getValue<string>()}</span>,
        },
        {
            id: 'timing',
            header: 'Timing',
            size: 160,
            Cell: ({ row }) => (
                <span className="text-sm font-mono">
                    {row.original.startTime} – {row.original.endTime}
                </span>
            ),
        },
        {
            accessorKey: 'regularHours',
            header: 'Regular Hours',
            size: 130,
            Cell: ({ cell }) => (
                <span className="text-sm">{cell.getValue<number>()}h</span>
            ),
        },
        {
            accessorKey: 'maxOvertimeHours',
            header: 'Max OT Hours',
            size: 130,
            Cell: ({ cell }) => (
                <span className="text-sm text-muted-foreground">+{cell.getValue<number>()}h</span>
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
        data: shifts,
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
                    onClick={() => onEdit(row.original)}
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

            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Shift?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.shiftName}</strong>? This cannot be undone.
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
