import { voiceProcessingService } from "../voice-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await voiceProcessingService.synthesizeSpeech(body)
    return Response.json(response)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
