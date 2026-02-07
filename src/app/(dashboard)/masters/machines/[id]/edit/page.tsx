'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { machineService, MachineResponse } from '@/lib/api/machines'
import { MachineBasicInfoForm } from '@/components/forms/machine-basic-info-form'
import { MachineProcessCapabilities } from '@/components/masters/machine-process-capabilities'

export default function EditMachinePage() {
  const params = useParams()
  const router = useRouter()
  const machineId = parseInt(params.id as string)

  const [loading, setLoading] = useState(true)
  const [machine, setMachine] = useState<MachineResponse | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    loadMachine()
  }, [machineId])

  const loadMachine = async () => {
    try {
      setLoading(true)
      const data = await machineService.getById(machineId)
      setMachine(data)
    } catch (error) {
      console.error('Failed to load machine:', error)
      toast.error('Failed to load machine details')
      router.push('/masters/machines')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading machine details...</p>
        </div>
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold">Machine not found</p>
          <Button asChild className="mt-4">
            <Link href="/masters/machines">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Machines
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/masters/machines">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Machine</h1>
            <p className="text-muted-foreground">
              {machine.machineCode} - {machine.machineName}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">
                <Settings className="mr-2 h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="capabilities">
                <Wrench className="mr-2 h-4 w-4" />
                Process Capabilities
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
              <MachineBasicInfoForm machine={machine} onSuccess={loadMachine} />
            </TabsContent>

            <TabsContent value="capabilities" className="space-y-4 mt-6">
              <MachineProcessCapabilities machineId={machineId} machineName={machine.machineName} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
