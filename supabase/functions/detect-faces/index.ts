import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByFaceIdCommand,
} from 'npm:@aws-sdk/client-rekognition'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COLLECTION_ID =
  Deno.env.get('AWS_REKOGNITION_COLLECTION_ID') || 'albums-prod'
const MATCH_THRESHOLD = Number(Deno.env.get('AWS_REKOGNITION_MATCH_THRESHOLD') || '95')
const MAX_FACES_PER_IMAGE = 20

const rekognition = new RekognitionClient({
  region: Deno.env.get('AWS_REGION') || 'eu-west-1',
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  },
})

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  try {
    const { photoId, imageBase64 } = await req.json()

    if (!photoId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: 'photoId and imageBase64 are required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const imageBytes = base64ToUint8Array(imageBase64)

    const indexResult = await rekognition.send(
      new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBytes },
        ExternalImageId: photoId,
        MaxFaces: MAX_FACES_PER_IMAGE,
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
          new SearchFacesByFaceIdCommand({
            CollectionId: COLLECTION_ID,
            FaceId: awsFaceId,
            MaxFaces: MAX_FACES_PER_IMAGE,
            FaceMatchThreshold: MATCH_THRESHOLD,
          }),
        )

        matches = (searchResult.FaceMatches ?? [])
          .filter((m) => m.Face?.FaceId && m.Face.FaceId !== awsFaceId)
          .map((m) => ({
            awsFaceId: m.Face!.FaceId!,
            similarity: m.Similarity ?? 0,
          }))
      } catch (searchErr) {
        console.error(`[detect-faces] SearchFaces failed for ${awsFaceId}:`, searchErr)
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

    console.log(`[detect-faces] photo=${photoId}: indexed ${faces.length} faces`)

    return new Response(
      JSON.stringify({ faces }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[detect-faces] Error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    )
  }
})
