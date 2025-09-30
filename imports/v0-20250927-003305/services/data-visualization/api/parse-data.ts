import { dataVisualizationService } from "../visualization-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const response = await dataVisualizationService.parseData(body)
    return Response.json(response)
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
