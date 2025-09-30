import { visionAnalysisService } from "../vision-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "analyze") {
      const response = await visionAnalysisService.analyzeImage(body)
      return Response.json(response)
    } else if (action === "ocr") {
      const response = await visionAnalysisService.extractText(body)
      return Response.json(response)
    } else if (action === "faces") {
      const response = await visionAnalysisService.analyzeFaces(body)
      return Response.json(response)
    } else if (action === "batch") {
      const response = await visionAnalysisService.batchAnalyze(body.requests)
      return Response.json({ results: response })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
