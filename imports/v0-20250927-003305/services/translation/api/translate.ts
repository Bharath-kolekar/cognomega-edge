import { translationService } from "../translation-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "translate") {
      const response = await translationService.translateText(body)
      return Response.json(response)
    } else if (action === "detect") {
      const detectedLanguage = await translationService.detectLanguage(body.text)
      return Response.json({
        detectedLanguage,
        confidence: 0.85,
        sessionId: body.sessionId,
      })
    } else if (action === "batch") {
      const response = await translationService.batchTranslate(body)
      return Response.json(response)
    } else if (action === "languages") {
      const languages = translationService.getSupportedLanguages()
      return Response.json({ languages })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
