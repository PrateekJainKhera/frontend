"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VendorResponse, vendorService } from '@/lib/api/vendors'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const VENDOR_TYPES = ['Manufacturer', 'Trader', 'Distributor', 'Importer', 'Service Provider']

const formSchema = z.object({
  vendorName: z.string().min(2, 'Vendor name is required'),
  vendorType: z.string().min(1, 'Type is required'),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pinCode: z.string().optional(),
  gstNo: z.string().optional(),
  panNo: z.string().optional(),
  creditDays: z.number().min(0).optional(),
  creditLimit: z.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  isActive: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditVendorDialogProps {
  vendor: VendorResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditVendorDialog({ vendor, open, onOpenChange, onSuccess }: EditVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendorName: vendor.vendorName, vendorType: vendor.vendorType,
      contactPerson: vendor.contactPerson || '', email: vendor.email || '',
      phone: vendor.phone || '', address: vendor.address || '',
      city: vendor.city || '', state: vendor.state || '',
      country: vendor.country || 'India', pinCode: vendor.pinCode || '',
      gstNo: vendor.gstNo || '', panNo: vendor.panNo || '',
      creditDays: vendor.creditDays ?? undefined, creditLimit: vendor.creditLimit ?? undefined,
      paymentTerms: vendor.paymentTerms || 'Net 30 Days', isActive: vendor.isActive,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await vendorService.update(vendor.id, {
        id: vendor.id, vendorCode: vendor.vendorCode,
        vendorName: data.vendorName, vendorType: data.vendorType,
        contactPerson: data.contactPerson || null, email: data.email || null,
        phone: data.phone || null, address: data.address || null,
        city: data.city || null, state: data.state || null,
        country: data.country || 'India', pinCode: data.pinCode || null,
        gstNo: data.gstNo || null, panNo: data.panNo || null,
        creditDays: data.creditDays ?? null, creditLimit: data.creditLimit ?? null,
        paymentTerms: data.paymentTerms, isActive: data.isActive,
      })
      toast.success('Vendor updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update vendor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vendor — {vendor.vendorCode}</DialogTitle>
          <DialogDescription>Update vendor information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="vendorName" render={({ field }) => (
                <FormItem><FormLabel>Vendor Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="vendorType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Vendor Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {VENDOR_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="contactPerson" render={({ field }) => (
                <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pinCode" render={({ field }) => (
                <FormItem><FormLabel>Pin Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="gstNo" render={({ field }) => (
                <FormItem><FormLabel>GST Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="panNo" render={({ field }) => (
                <FormItem><FormLabel>PAN Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="creditDays" render={({ field }) => (
                <FormItem><FormLabel>Credit Days</FormLabel>
                  <FormControl><Input type="number" {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} /></FormControl>
                  <FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                <FormItem><FormLabel>Payment Terms</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
