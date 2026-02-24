"use client"

import { useParams } from 'next/navigation'
import OpeningStockForm from '../_form'

export default function OpeningStockDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <OpeningStockForm id={parseInt(id)} />
}
