import { contextMemoryService } from "../memory-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case "store":
        await contextMemoryService.storeContext(body.userId, body.sessionId, body.data)
        return Response.json({ success: true })

      case "retrieve":
        const context = await contextMemoryService.retrieveContext(body.query)
        return Response.json(context)

      case "add_conversation":
        await contextMemoryService.addConversationEntry(body.userId, body.sessionId, body.entry)
        return Response.json({ success: true })

      case "update_preferences":
        await contextMemoryService.updateUserPreferences(body.userId, body.sessionId, body.preferences)
        return Response.json({ success: true })

      case "analyze_skills":
        const skills = await contextMemoryService.analyzeUserSkills(body.userId, body.interactions)
        return Response.json({ skills })

      case "get_suggestions":
        const suggestions = await contextMemoryService.getPersonalizedSuggestions(body.userId, body.currentContext)
        return Response.json({ suggestions })

      case "clear_user":
        contextMemoryService.clearUserContext(body.userId)
        return Response.json({ success: true })

      case "clear_session":
        contextMemoryService.clearSessionContext(body.sessionId)
        return Response.json({ success: true })

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
