export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.AI) {
      return Response.json(
        {
          success: false,
          error: "Workers AI binding is not configured."
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const problem = body.problem?.trim();

    if (!problem) {
      return Response.json(
        {
          success: false,
          error: "Please describe the problem."
        },
        { status: 400 }
      );
    }

    if (problem.length > 500) {
      return Response.json(
        {
          success: false,
          error: "Problem description is too long."
        },
        { status: 400 }
      );
    }

    const categories = [
      "AC & Cooling",
      "Plumbing",
      "Electrical",
      "General Maintenance",
      "Carpentry & Furniture",
      "Home Services"
    ];

    const systemPrompt = `
You are the AI service assistant for Fixer.Co.

Your job is to analyze a customer's home maintenance problem
and recommend the most suitable service category.

You MUST choose only one of these categories:

- AC & Cooling
- Plumbing
- Electrical
- General Maintenance
- Carpentry & Furniture
- Home Services

Rules:
1. Do not invent new categories.
2. If the problem is unclear, choose the closest category but give a lower confidence score.
3. Confidence must be an integer from 0 to 100.
4. Keep the explanation short and simple.
5. Do not claim that your suggestion is a guaranteed diagnosis.

Return ONLY valid JSON in this exact format:

{
  "category": "category name",
  "confidence": 0,
  "explanation": "short explanation"
}
`;

    const aiResponse = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Customer problem: ${problem}`
          }
        ],
        max_tokens: 120,
        temperature: 0.2
      }
    );

    let rawResponse =
      aiResponse?.response?.trim() || "";

    rawResponse = rawResponse
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let result;

    try {
      result = JSON.parse(rawResponse);
    } catch {
      console.error(
        "Invalid AI JSON response:",
        rawResponse
      );

      return Response.json(
        {
          success: false,
          error: "The AI returned an invalid response."
        },
        { status: 500 }
      );
    }

    if (
      !categories.includes(result.category)
    ) {
      return Response.json(
        {
          success: false,
          error: "The AI returned an unknown service category."
        },
        { status: 500 }
      );
    }

    const confidence = Math.max(
      0,
      Math.min(
        100,
        Number.parseInt(
          result.confidence,
          10
        ) || 0
      )
    );

    return Response.json({
      success: true,

      diagnosis: {
        category: result.category,
        confidence,
        explanation:
          result.explanation ||
          "AI service suggestion."
      }
    });

  } catch (error) {
    console.error(
      "AI diagnose error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          "AI service is temporarily unavailable."
      },
      { status: 500 }
    );
  }
}