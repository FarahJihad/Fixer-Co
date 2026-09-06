export async function onRequestPost(context) {
  try {
    const { env } = context;

    if (!env.AI) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI binding is missing"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const result = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        prompt: "Reply with exactly: AI WORKS",
        max_tokens: 20
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        message: error?.message || null,
        name: error?.name || null
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}