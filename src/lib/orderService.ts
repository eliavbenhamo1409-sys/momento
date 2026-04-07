import { supabase } from './supabase'
import type { AlbumConfig, OrderStatus } from '../types'

export interface ShippingAddress {
  name: string
  address: string
  city: string
  zip: string
  phone: string
}

export interface OrderRow {
  id: string
  user_id: string
  album_id: string
  order_number: string
  status: OrderStatus
  total_price: number
  shipping_address: ShippingAddress | null
  album_config: AlbumConfig | null
  export_paths: string[]
  created_at: string
  updated_at: string
}

function generateOrderNumber(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MOM-${y}${m}-${rand}`
}

export async function createOrder(
  userId: string,
  albumId: string,
  shipping: ShippingAddress,
  totalPrice: number,
  albumConfig: AlbumConfig,
): Promise<OrderRow> {
  const orderNumber = generateOrderNumber()

  const { data, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      album_id: albumId,
      order_number: orderNumber,
      status: 'processing',
      total_price: totalPrice,
      shipping_address: shipping as unknown as Record<string, unknown>,
      album_config: albumConfig as unknown as Record<string, unknown>,
      export_paths: [],
    })
    .select('*')
    .single()

  if (error) throw error
  return data as OrderRow
}

export async function updateOrderExport(
  orderId: string,
  exportPaths: string[],
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({
      export_paths: exportPaths,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) throw error
}

export async function updateAlbumStatus(
  albumId: string,
  status: 'draft' | 'ordered' | 'archived',
): Promise<void> {
  const { error } = await supabase
    .from('albums')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', albumId)

  if (error) throw error
}

export async function getOrder(orderId: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as OrderRow
}

export interface OrderWithAlbum extends OrderRow {
  album_title: string
  album_cover_url: string | null
}

export async function listUserOrders(userId: string): Promise<OrderWithAlbum[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, albums(title, cover_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const album = row.albums as { title: string; cover_url: string | null } | null
    return {
      ...row,
      album_title: album?.title ?? 'אלבום',
      album_cover_url: album?.cover_url ?? null,
    } as OrderWithAlbum
  })
}

export async function uploadExportPage(
  userId: string,
  orderId: string,
  index: number,
  blob: Blob,
): Promise<string> {
  const fileName = `spread-${String(index).padStart(3, '0')}.jpg`
  const storagePath = `${userId}/${orderId}/${fileName}`

  const { error } = await supabase.storage
    .from('order-exports')
    .upload(storagePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) throw error
  return storagePath
}
