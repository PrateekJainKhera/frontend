export interface Shift {
  id: number
  shiftName: string
  startTime: string   // "08:00"
  endTime: string     // "16:00"
  regularHours: number
  maxOvertimeHours: number
  isActive: boolean
}

export interface CreateShiftRequest {
  shiftName: string
  startTime: string
  endTime: string
  regularHours: number
  maxOvertimeHours: number
  isActive: boolean
}
