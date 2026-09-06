export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    /* Make sure the Workers AI binding exists */
    if (!env.AI) {
      return jsonResponse(
        {
          success: false,
          error: "AI binding is not configured."
        },
        500
      );
    }

    /* Read data sent from the frontend */
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body."
        },
        400
      );
    }

    const problem =
      typeof body.problem === "string"
        ? body.problem.trim()
        : "";

    /* Validate the problem description */
    if (!problem) {
      return jsonResponse(
        {
          success: false,
          error: "Please describe the problem first."
        },
        400
      );
    }

    if (problem.length > 500) {
      return jsonResponse(
        {
          success: false,
          error:
            "Please keep the problem description under 500 characters."
        },
        400
      );
    }

    /*
      These are the ONLY service categories
      the AI is allowed to recommend.
    */
    const categories = [
      "AC & Cooling",
      "Plumbing",
      "Electrical",
      "General Maintenance",
      "Carpentry & Furniture",
      "Home Services"
    ];

    /*
      Ask the AI to classify the customer's problem.

      We use a very strict response format because
      it is easier and safer for our JavaScript to read.
    */
    const prompt = `
You are the AI service assistant for Fixer.Co.

Your task is to classify a customer's home maintenance problem.

Choose EXACTLY ONE category from this list:

AC & Cooling
Plumbing
Electrical
General Maintenance
Carpentry & Furniture
Home Services

Customer problem:
"${problem}"

Rules:
- Never create a new category.
- Choose the category that best matches the problem.
- Confidence must be an integer from 0 to 100.
- If the description is unclear, lower the confidence.
- Give one short explanation.
- This is a service recommendation, not a guaranteed technical diagnosis.

IMPORTANT:
Return ONLY the following three lines.
Do not add markdown.
Do not add extra text.

CATEGORY: category name
CONFIDENCE: number
EXPLANATION: short explanation
`;

    /* Send the prompt to Cloudflare Workers AI */
    const aiResult = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        prompt,
        max_tokens: 100,
        temperature: 0.1
      }
    );

    /*
      Workers AI can return generated text in
      different response shapes depending on the model.

      First try response, then choices[0].text.
    */
    const generatedText =
      aiResult?.response ||
      aiResult?.choices?.[0]?.text ||
      "";

    if (!generatedText) {
      console.error(
        "Workers AI returned no text:",
        JSON.stringify(aiResult)
      );

      return jsonResponse(
        {
          success: false,
          error: "AI did not return a recommendation."
        },
        500
      );
    }

    /*
      Extract the three values from the AI response.
    */
    const categoryMatch =
      generatedText.match(
        /CATEGORY:\s*(.+)/i
      );

    const confidenceMatch =
      generatedText.match(
        /CONFIDENCE:\s*(\d+)/i
      );

    const explanationMatch =
      generatedText.match(
        /EXPLANATION:\s*(.+)/i
      );

    const category =
      categoryMatch?.[1]?.trim();

    /*
      Never trust an AI response without validation.

      If it returns a category that does not exist
      in Fixer.Co, reject the response.
    */
    if (
      !category ||
      !categories.includes(category)
    ) {
      console.error(
        "Invalid AI category:",
        generatedText
      );

      return jsonResponse(
        {
          success: false,
          error:
            "AI could not match the problem to a valid service."
        },
        500
      );
    }

    /* Keep confidence safely between 0 and 100 */
    let confidence =
      Number.parseInt(
        confidenceMatch?.[1] || "0",
        10
      );

    confidence = Math.max(
      0,
      Math.min(100, confidence)
    );

    const explanation =
      explanationMatch?.[1]?.trim() ||
      "This service appears to be the closest match for your problem.";

    /*
      Send a clean result back to Fixer.Co.
    */
    return jsonResponse({
      success: true,

      diagnosis: {
        category,
        confidence,
        explanation
      }
    });

  } catch (error) {
    console.error(
      "AI diagnose error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          "AI service is temporarily unavailable."
      },
      500
    );
  }
}


/*
  Small helper function for returning JSON responses.
*/
function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8"
      }
    }
  );
}