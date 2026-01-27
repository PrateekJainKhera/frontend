"use client"

import { useState } from 'react'
import { MaterialDailyBalance } from '@/types/material-daily-balance'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ArrowDown, ArrowUp, Search, Calendar, ChevronDown, ChevronRight } from 'lucide-react'

interface MaterialInventoryListProps {
    materials: MaterialDailyBalance[]
    date: Date
    onMaterialClick?: (material: MaterialDailyBalance) => void
    onDateChange?: (date: Date) => void
}

// Format length to display nicely
const formatLength = (mm: number): string => {
    if (mm >= 1000) {
        return `${(mm / 1000).toFixed(2)}m`
    }
    return `${mm}mm`
}

export function MaterialInventoryList({
    materials,
    date,
    onMaterialClick,
    onDateChange
}: MaterialInventoryListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Steel', 'Stainless Steel', 'Alloy', 'Other'])

    // Filter materials
    const filteredMaterials = materials.filter(m =>
        m.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.grade.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Group by category
    const groupedMaterials = filteredMaterials.reduce((acc, material) => {
        const category = material.category
        if (!acc[category]) {
            acc[category] = []
        }
        acc[category].push(material)
        return acc
    }, {} as Record<string, MaterialDailyBalance[]>)

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        )
    }

    // Summary stats
    const totalMaterials = materials.length
    const lowStockCount = materials.filter(m => m.isLowStock).length
    const totalReceived = materials.reduce((sum, m) => sum + m.receivedLengthMM, 0)
    const totalIssued = materials.reduce((sum, m) => sum + m.issuedLengthMM, 0)

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Date Selector */}
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={date.toISOString().split('T')[0]}
                        onChange={(e) => onDateChange?.(new Date(e.target.value))}
                        className="w-auto"
                    />
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 flex-1 max-w-sm">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search material or grade..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-2">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Materials</CardDescription>
                        <CardTitle className="text-2xl">{totalMaterials}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className={`border-2 ${lowStockCount > 0 ? 'border-destructive' : ''}`}>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            {lowStockCount > 0 && <AlertTriangle className="h-4 w-4 text-destructive" />}
                            Low Stock
                        </CardDescription>
                        <CardTitle className={`text-2xl ${lowStockCount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                            {lowStockCount}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-2">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <ArrowDown className="h-4 w-4 text-green-600" />
                            Today Received
                        </CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {formatLength(totalReceived)}
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="border-2">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-1">
                            <ArrowUp className="h-4 w-4 text-blue-600" />
                            Today Issued
                        </CardDescription>
                        <CardTitle className="text-2xl text-blue-600">
                            {formatLength(totalIssued)}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Material Table by Category */}
            {Object.entries(groupedMaterials).map(([category, categoryMaterials]) => (
                <Card key={category} className="border-2">
                    {/* Category Header */}
                    <CardHeader
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleCategory(category)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {expandedCategories.includes(category) ? (
                                    <ChevronDown className="h-5 w-5" />
                                ) : (
                                    <ChevronRight className="h-5 w-5" />
                                )}
                                <CardTitle className="text-lg">{category}</CardTitle>
                                <Badge variant="secondary">{categoryMaterials.length} items</Badge>
                                {categoryMaterials.some(m => m.isLowStock) && (
                                    <Badge variant="destructive" className="gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Low Stock
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    {/* Category Table */}
                    {expandedCategories.includes(category) && (
                        <CardContent className="pt-0">
                            <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[180px]">Material</TableHead>
                                            <TableHead className="text-center">Opening</TableHead>
                                            <TableHead className="text-center text-green-600">Received</TableHead>
                                            <TableHead className="text-center text-blue-600">Issued</TableHead>
                                            <TableHead className="text-center text-orange-600">Scrap</TableHead>
                                            <TableHead className="text-center font-bold">Closing</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categoryMaterials.map((material) => (
                                            <TableRow
                                                key={material.id}
                                                className={`cursor-pointer hover:bg-muted/50 ${material.isLowStock ? 'bg-red-50' : ''}`}
                                                onClick={() => onMaterialClick?.(material)}
                                            >
                                                {/* Material Info */}
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{material.materialName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {material.grade} • Ø{material.diameter}mm
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Opening Balance */}
                                                <TableCell className="text-center">
                                                    <div className="text-sm">{material.openingPieces} pcs</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatLength(material.openingLengthMM)}
                                                    </div>
                                                </TableCell>

                                                {/* Received */}
                                                <TableCell className="text-center">
                                                    {material.receivedPieces > 0 ? (
                                                        <>
                                                            <div className="text-sm text-green-600">+{material.receivedPieces} pcs</div>
                                                            <div className="text-xs text-green-600">
                                                                +{formatLength(material.receivedLengthMM)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>

                                                {/* Issued */}
                                                <TableCell className="text-center">
                                                    {material.issuedPieces > 0 ? (
                                                        <>
                                                            <div className="text-sm text-blue-600">-{material.issuedPieces} pcs</div>
                                                            <div className="text-xs text-blue-600">
                                                                -{formatLength(material.issuedLengthMM)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>

                                                {/* Scrap */}
                                                <TableCell className="text-center">
                                                    {material.scrapPieces > 0 ? (
                                                        <>
                                                            <div className="text-sm text-orange-600">-{material.scrapPieces} pcs</div>
                                                            <div className="text-xs text-orange-600">
                                                                -{formatLength(material.scrapLengthMM)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>

                                                {/* Closing Balance */}
                                                <TableCell className="text-center">
                                                    <div className="text-sm font-bold">{material.closingPieces} pcs</div>
                                                    <div className="text-xs font-medium">
                                                        {formatLength(material.closingLengthMM)}
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="text-center">
                                                    {material.isLowStock ? (
                                                        <Badge variant="destructive" className="gap-1">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Low
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                            OK
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    )}
                </Card>
            ))}

            {/* Empty State */}
            {Object.keys(groupedMaterials).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No materials found
                </div>
            )}
        </div>
    )
}
