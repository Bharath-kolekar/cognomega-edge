import { voiceProcessingService } from "../voice-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, sessionId, language, continuous, interimResults } = body

    if (action === "start") {
      const response = await voiceProcessingService.startVoiceRecognition({
        sessionId,
        language,
        continuous,
        interimResults,
      })
      return Response.json(response)
    } else if (action === "stop") {
      voiceProcessingService.stopVoiceRecognition(sessionId)
      return Response.json({ success: true, sessionId })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
