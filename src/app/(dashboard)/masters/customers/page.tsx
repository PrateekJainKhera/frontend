"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockCustomers } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Customer } from '@/types'
import { CustomersDataGrid } from '@/components/tables/customers-data-grid'
import { CreateCustomerDialog } from '@/components/forms/create-customer-dialog'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockCustomers, 800)
    setCustomers(data)
    setLoading(false)
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMicClick = () => {
    alert('Voice search feature coming soon!')
  }

  return (
    <div className="space-y-4">
      {/* Search Bar - Large Width, Thin Height */}
      <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm w-full max-w-2xl">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search by name, code, or contact person..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleMicClick}
          title="Voice search (coming soon)"
        >
          <Mic className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Customers</CardDescription>
            <CardTitle className="text-2xl">{customers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {customers.filter(c => c.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Inactive</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">
              {customers.filter(c => !c.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Search Results</CardDescription>
            <CardTitle className="text-2xl">{filteredCustomers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Grid Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <CustomersDataGrid customers={filteredCustomers} onUpdate={loadCustomers} />
      )}

      {/* Create Dialog */}
      <CreateCustomerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadCustomers}
      />

      {/* Floating Action Button Only */}
      <Button
        onClick={() => setIsCreateDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
