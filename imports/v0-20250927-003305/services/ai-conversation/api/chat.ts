import { aiConversationService } from "../conversation-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, sessionId, context, tools, stream } = body

    if (stream) {
      const streamResponse = await aiConversationService.streamConversation({
        message,
        sessionId,
        context,
        tools,
      })

      return new Response(streamResponse, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
        },
      })
    } else {
      const response = await aiConversationService.processConversation({
        message,
        sessionId,
        context,
        tools,
      })

      return Response.json(response)
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
