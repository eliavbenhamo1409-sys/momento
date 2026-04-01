import { supabase, getPublicUrl } from './supabase'
import { mergeAlbumConfig } from '../store/albumStore'
import type { EditorSpread, AlbumConfig, AlbumPerson } from '../types'

export interface AlbumRow {
  id: string
  user_id: string
  title: string
  cover_url: string | null
  config: AlbumConfig
  spreads: EditorSpread[]
  people_roster: AlbumPerson[]
  status: 'draft' | 'ordered' | 'archived'
  created_at: string
  updated_at: string
}

async function uploadBlobToStorage(
  userId: string,
  albumId: string,
  blobUrl: string,
): Promise<string> {
  const response = await fetch(blobUrl)
  const blob = await response.blob()
  const ext = blob.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const storagePath = `${userId}/${albumId}/${fileName}`

  const { error } = await supabase.storage
    .from('album-photos')
    .upload(storagePath, blob, { contentType: blob.type, upsert: false })

  if (error) throw error
  return getPublicUrl(storagePath)
}

async function replaceBlobUrls(
  spreads: EditorSpread[],
  userId: string,
  albumId: string,
): Promise<EditorSpread[]> {
  const uploadCache = new Map<string, string>()

  const processUrl = async (url: string | null | undefined): Promise<string | null> => {
    if (!url) return null
    if (!url.startsWith('blob:')) return url
    if (uploadCache.has(url)) return uploadCache.get(url)!

    const publicUrl = await uploadBlobToStorage(userId, albumId, url)
    uploadCache.set(url, publicUrl)
    return publicUrl
  }

  const result: EditorSpread[] = []

  for (const spread of spreads) {
    const cloned = structuredClone(spread)

    if (cloned.leftPhotos) {
      cloned.leftPhotos = await Promise.all(
        cloned.leftPhotos.map((url) => processUrl(url)),
      )
    }
    if (cloned.rightPhotos) {
      cloned.rightPhotos = await Promise.all(
        cloned.rightPhotos.map((url) => processUrl(url)),
      )
    }

    if (cloned.design) {
      for (const el of cloned.design.elements) {
        if (el.type === 'photo' && el.photoUrl) {
          el.photoUrl = await processUrl(el.photoUrl)
        }
      }

      const bg = cloned.design.background
      if (bg.blurPhotoUrl) bg.blurPhotoUrl = (await processUrl(bg.blurPhotoUrl)) ?? undefined
      if (bg.generatedBgUrl) bg.generatedBgUrl = (await processUrl(bg.generatedBgUrl)) ?? undefined
      if (bg.generatedBgLeftUrl) bg.generatedBgLeftUrl = (await processUrl(bg.generatedBgLeftUrl)) ?? undefined
      if (bg.generatedBgRightUrl) bg.generatedBgRightUrl = (await processUrl(bg.generatedBgRightUrl)) ?? undefined
    }

    result.push(cloned)
  }

  return result
}

export async function saveAlbum(
  albumId: string | null,
  userId: string,
  title: string,
  config: AlbumConfig,
  spreads: EditorSpread[],
  peopleRoster?: AlbumPerson[],
): Promise<string> {
  const id = albumId || crypto.randomUUID()

  const cleanedSpreads = await replaceBlobUrls(spreads, userId, id)

  const coverUrl = findCoverUrl(cleanedSpreads)

  const row = {
    id,
    user_id: userId,
    title,
    cover_url: coverUrl,
    config: config as unknown as Record<string, unknown>,
    spreads: cleanedSpreads as unknown as Record<string, unknown>[],
    people_roster: (peopleRoster ?? []) as unknown as Record<string, unknown>[],
    status: 'draft',
  }

  const { error } = await supabase
    .from('albums')
    .upsert(row, { onConflict: 'id' })

  if (error) throw error
  return id
}

export async function loadAlbum(albumId: string): Promise<AlbumRow | null> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  const row = data as AlbumRow
  return {
    ...row,
    config: mergeAlbumConfig(row.config),
    people_roster: Array.isArray(row.people_roster) ? row.people_roster : [],
  }
}

export async function listUserAlbums(userId: string): Promise<AlbumRow[]> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as AlbumRow[]).map((row) => ({
    ...row,
    config: mergeAlbumConfig(row.config),
  }))
}

export async function deleteAlbum(albumId: string): Promise<void> {
  const { error } = await supabase
    .from('albums')
    .delete()
    .eq('id', albumId)

  if (error) throw error
}

function findCoverUrl(spreads: EditorSpread[]): string | null {
  for (const s of spreads) {
    if (s.design) {
      for (const el of s.design.elements) {
        if (el.type === 'photo' && el.photoUrl) return el.photoUrl
      }
    }
    const firstPhoto = s.leftPhotos?.find(Boolean) ?? s.rightPhotos?.find(Boolean)
    if (firstPhoto) return firstPhoto
  }
  return null
}
