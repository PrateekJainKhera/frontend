"use client"

import { useState, useEffect } from 'react'
import { Settings, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/axios-config'

interface AppSetting {
  key: string
  value: string
  description?: string
  updatedAt?: string
  updatedBy?: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, string>>({})

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/app-settings')
      const data: AppSetting[] = res.data?.data || []
      setSettings(data)
      const initial: Record<string, string> = {}
      data.forEach(s => { initial[s.key] = s.value })
      setEdits(initial)
    } catch {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    setSaving(key)
    try {
      await apiClient.put(`/app-settings/${key}`, {
        value: edits[key],
        updatedBy: 'Admin'
      })
      toast.success(`${key} updated successfully`)
      loadSettings()
    } catch {
      toast.error(`Failed to update ${key}`)
    } finally {
      setSaving(null)
    }
  }

  const LABELS: Record<string, { label: string; description: string; suffix?: string }> = {
    GSTRate: {
      label: 'GST Rate',
      description: 'GST percentage applied to all new estimations. Changing this will not affect existing estimations.',
      suffix: '%'
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground text-sm">Configure global ERP settings</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-4">
          {settings.map(setting => {
            const meta = LABELS[setting.key]
            return (
              <Card key={setting.key} className="border-2 border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{meta?.label ?? setting.key}</CardTitle>
                  {meta?.description && (
                    <p className="text-sm text-muted-foreground">{meta.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor={setting.key}>Value {meta?.suffix ? `(${meta.suffix})` : ''}</Label>
                      <div className="relative mt-1">
                        <Input
                          id={setting.key}
                          type="number"
                          value={edits[setting.key] ?? setting.value}
                          onChange={e => setEdits(prev => ({ ...prev, [setting.key]: e.target.value }))}
                          className="pr-8"
                        />
                        {meta?.suffix && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            {meta.suffix}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSave(setting.key)}
                      disabled={saving === setting.key || edits[setting.key] === setting.value}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving === setting.key ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  {setting.updatedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated: {setting.updatedAt}{setting.updatedBy ? ` by ${setting.updatedBy}` : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
