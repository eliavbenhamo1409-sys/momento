import { supabase } from '../lib/supabase'

export type AdminOrderStatus = 'pending' | 'processing' | 'printing' | 'shipped' | 'delivered'

export interface AdminOrder {
  id: string
  order_number: string
  status: AdminOrderStatus
  total_price: number
  shipping_address: {
    name: string
    address: string
    city: string
    zip: string
    phone: string
  } | null
  album_config: Record<string, unknown> | null
  export_paths: string[]
  created_at: string
  updated_at: string
  user_id: string
  album_id: string
  album_title: string
  album_cover_url: string | null
  customer_name: string
  customer_email: string
}

export interface AdminStats {
  totalOrders: number
  totalRevenue: number
  pendingCount: number
  printingCount: number
  shippedCount: number
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()

  if (error || !data) return false
  return data.is_admin === true
}

export async function listAllOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, albums(title, cover_url, user_id), profiles:user_id(display_name)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => {
    const album = row.albums as { title: string; cover_url: string | null } | null
    const profile = row.profiles as { display_name: string } | null

    return {
      id: row.id as string,
      order_number: row.order_number as string,
      status: row.status as AdminOrderStatus,
      total_price: Number(row.total_price) || 0,
      shipping_address: row.shipping_address as AdminOrder['shipping_address'],
      album_config: row.album_config as Record<string, unknown> | null,
      export_paths: Array.isArray(row.export_paths) ? row.export_paths as string[] : [],
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
      user_id: row.user_id as string,
      album_id: row.album_id as string,
      album_title: album?.title ?? 'אלבום',
      album_cover_url: album?.cover_url ?? null,
      customer_name: profile?.display_name ?? 'לקוח',
      customer_email: '',
    }
  })
}

export async function getOrderDetail(orderId: string): Promise<AdminOrder | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, albums(title, cover_url, user_id), profiles:user_id(display_name)')
    .eq('id', orderId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const row = data as Record<string, unknown>
  const album = row.albums as { title: string; cover_url: string | null } | null
  const profile = row.profiles as { display_name: string } | null

  return {
    id: row.id as string,
    order_number: row.order_number as string,
    status: row.status as AdminOrderStatus,
    total_price: Number(row.total_price) || 0,
    shipping_address: row.shipping_address as AdminOrder['shipping_address'],
    album_config: row.album_config as Record<string, unknown> | null,
    export_paths: Array.isArray(row.export_paths) ? row.export_paths as string[] : [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_id: row.user_id as string,
    album_id: row.album_id as string,
    album_title: album?.title ?? 'אלבום',
    album_cover_url: album?.cover_url ?? null,
    customer_name: profile?.display_name ?? 'לקוח',
    customer_email: '',
  }
}

export async function updateOrderStatus(orderId: string, status: AdminOrderStatus): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw error
}

export async function getExportSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('order-exports')
    .createSignedUrl(storagePath, 3600)

  if (error) return null
  return data.signedUrl
}

export async function getExportSignedUrls(paths: string[]): Promise<{ path: string; url: string }[]> {
  const results: { path: string; url: string }[] = []
  for (const path of paths) {
    const url = await getExportSignedUrl(path)
    if (url) results.push({ path, url })
  }
  return results
}

export function getAdminStats(orders: AdminOrder[]): AdminStats {
  return {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total_price, 0),
    pendingCount: orders.filter((o) => o.status === 'pending' || o.status === 'processing').length,
    printingCount: orders.filter((o) => o.status === 'printing').length,
    shippedCount: orders.filter((o) => o.status === 'shipped').length,
  }
}
