const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FaceResult {
  awsFaceId: string
  confidence: number
  boundingBox: { Width: number; Height: number; Left: number; Top: number }
  faceIndexInPhoto: number
  matches: Array<{ awsFaceId: string; similarity: number }>
}

function base64ToUint8Array(b64: string): Uint8Array {
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

let _client: any = null

async function getRekognitionClient() {
  if (_client) return _client
  const { RekognitionClient } = await import('npm:@aws-sdk/client-rekognition')
  _client = new RekognitionClient({
    region: Deno.env.get('AWS_REGION') || 'eu-west-1',
    credentials: {
      accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
      secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
    },
  })
  return _client
}

async function ensureCollection(rekognition: any, collectionId: string) {
  const { ListCollectionsCommand, CreateCollectionCommand } =
    await import('npm:@aws-sdk/client-rekognition')

  const listResult = await rekognition.send(new ListCollectionsCommand({}))
  const existing = listResult.CollectionIds ?? []

  if (!existing.includes(collectionId)) {
    await rekognition.send(new CreateCollectionCommand({ CollectionId: collectionId }))
    console.log(`[detect-faces] Created collection: ${collectionId}`)
  }
}

async function purgeCollection(rekognition: any, collectionId: string) {
  const { DeleteCollectionCommand, CreateCollectionCommand } =
    await import('npm:@aws-sdk/client-rekognition')

  try {
    await rekognition.send(new DeleteCollectionCommand({ CollectionId: collectionId }))
    console.log(`[detect-faces] Deleted collection: ${collectionId}`)
  } catch (_e) {
    // Collection might not exist yet
  }

  await rekognition.send(new CreateCollectionCommand({ CollectionId: collectionId }))
  console.log(`[detect-faces] Created fresh collection: ${collectionId}`)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const { action } = body

    const rekognition = await getRekognitionClient()

    // ── Purge action: delete and recreate collection ──
    if (action === 'purge') {
      const collectionId = body.collectionId ||
        Deno.env.get('AWS_REKOGNITION_COLLECTION_ID') || 'albums-prod'

      await purgeCollection(rekognition, collectionId)

      return new Response(
        JSON.stringify({ success: true, collectionId }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    // ── Detect action (default): index faces and search matches ──
    const { photoId, imageBase64, collectionId: reqCollectionId } = body

    if (!photoId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'photoId and imageBase64 are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const { IndexFacesCommand, SearchFacesCommand } =
      await import('npm:@aws-sdk/client-rekognition')

    const COLLECTION_ID = reqCollectionId ||
      Deno.env.get('AWS_REKOGNITION_COLLECTION_ID') || 'albums-prod'
    const MATCH_THRESHOLD = Number(
      Deno.env.get('AWS_REKOGNITION_MATCH_THRESHOLD') || '80',
    )
    const MAX_FACES = 20

    await ensureCollection(rekognition, COLLECTION_ID)

    const imageBytes = base64ToUint8Array(imageBase64)

    const indexResult = await rekognition.send(
      new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: photoId,
        MaxFaces: MAX_FACES,
        DetectionAttributes: ['DEFAULT'],
        QualityFilter: 'AUTO',
      }),
    )

    const faceRecords = indexResult.FaceRecords ?? []
    const faces: FaceResult[] = []

    for (let i = 0; i < faceRecords.length; i++) {
      const record = faceRecords[i]
      const face = record.Face
      if (!face?.FaceId || !face.BoundingBox) continue

      const bb = face.BoundingBox
      const awsFaceId = face.FaceId

      let matches: FaceResult['matches'] = []
      try {
        const searchResult = await rekognition.send(
          new SearchFacesCommand({
            CollectionId: COLLECTION_ID,
            FaceId: awsFaceId,
            MaxFaces: MAX_FACES,
            FaceMatchThreshold: MATCH_THRESHOLD,
          }),
        )

        matches = (searchResult.FaceMatches ?? [])
          .filter(
            (m: any) => m.Face?.FaceId && m.Face.FaceId !== awsFaceId,
          )
          .map((m: any) => ({
            awsFaceId: m.Face!.FaceId!,
            similarity: m.Similarity ?? 0,
          }))
      } catch (searchErr) {
        console.error(
          `[detect-faces] SearchFaces failed for ${awsFaceId}:`,
          searchErr,
        )
      }

      faces.push({
        awsFaceId,
        confidence: face.Confidence ?? 0,
        boundingBox: {
          Width: bb.Width ?? 0,
          Height: bb.Height ?? 0,
          Left: bb.Left ?? 0,
          Top: bb.Top ?? 0,
        },
        faceIndexInPhoto: i,
        matches,
      })
    }

    console.log(
      `[detect-faces] photo=${photoId}: ${faces.length} faces, matches: [${faces.map(f => `${f.awsFaceId.slice(0,8)}→${f.matches.length}`).join(', ')}]`,
    )

    return new Response(JSON.stringify({ faces }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[detect-faces] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
