export async function onRequestPost(context) {

  try {

    const { request, env } = context;


    /* =========================
       CHECK AI BINDING
    ========================= */

    if (!env.AI) {

      return jsonResponse(
        {
          success: false,
          error: "AI binding is not configured."
        },
        500
      );

    }


    /* =========================
       READ REQUEST
    ========================= */

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


    const image =
      typeof body.image === "string"
        ? body.image.trim()
        : "";


    const problem =
      typeof body.problem === "string"
        ? body.problem.trim()
        : "";


    /* =========================
       VALIDATE IMAGE
    ========================= */

    if (!image) {

      return jsonResponse(
        {
          success: false,
          error: "Please provide an image."
        },
        400
      );

    }


    /*
      Only accept image Data URLs.
      Example:
      data:image/jpeg;base64,...
    */

    if (
      !image.startsWith("data:image/")
    ) {

      return jsonResponse(
        {
          success: false,
          error: "Invalid image format."
        },
        400
      );

    }


    if (problem.length > 500) {

      return jsonResponse(
        {
          success: false,
          error:
            "Please keep the description under 500 characters."
        },
        400
      );

    }


    /* =========================
       VALID FIXER.CO SERVICES
    ========================= */

    const categories = [
      "AC & Cooling",
      "Plumbing",
      "Electrical",
      "Appliances",
      "Carpentry & Furniture",
      "General Maintenance"
    ];


    /* =========================
       AI PROMPT
    ========================= */

    const prompt = `
You are the AI visual service classifier for Fixer.Co.

Look carefully at the customer's uploaded repair image.

Your task is NOT to provide a guaranteed technical diagnosis.

Your task is to recommend the ONE Fixer.Co service category that is most appropriate for the visible problem.

VALID CATEGORIES:

1. AC & Cooling
Air conditioners, AC units, cooling systems and related problems.

2. Plumbing
Pipes, sinks, faucets, toilets, drains, visible water leaks and plumbing problems.

3. Electrical
Electrical outlets, switches, wiring, lights, breakers and electrical problems.

4. Appliances
Washing machines, refrigerators, dryers, ovens, microwaves, dishwashers and other home appliances.

5. Carpentry & Furniture
Wooden doors, cabinets, tables, chairs, shelves and furniture repairs.

6. General Maintenance
General home repairs or visible problems that do not clearly belong to another category.

IMPORTANT RULES:

- Choose EXACTLY ONE category.
- Never invent another category.
- Analyze what is actually visible in the image.
- If the image is unclear, use a lower confidence.
- Do not pretend you can see damage that is not visible.
- If text from the customer is provided, use it together with the image.
- The category and explanation must agree.
- Confidence must be an integer from 0 to 100.
- Keep the explanation short.
- This is only a service recommendation, not a guaranteed diagnosis.

Customer description:
${problem || "No written description was provided."}

Return ONLY these three lines:

CATEGORY: exact category name
CONFIDENCE: number
EXPLANATION: one short explanation
`;


    /* =========================
       RUN CLOUDFLARE VISION AI
    ========================= */

    const aiResult =
      await env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {
          prompt,
          image,
          max_tokens: 120,
          temperature: 0
        }
      );


    /* =========================
       READ AI RESPONSE
    ========================= */

    const generatedText =
      aiResult?.response ||
      aiResult?.choices?.[0]?.text ||
      "";


    if (!generatedText) {

      console.error(
        "Vision AI returned no text:",
        JSON.stringify(aiResult)
      );


      return jsonResponse(
        {
          success: false,
          error:
            "Vision AI did not return a recommendation."
        },
        500
      );

    }


    /* =========================
       PARSE AI RESPONSE
    ========================= */

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


    /* =========================
       VALIDATE AI CATEGORY
    ========================= */

    if (
      !category ||
      !categories.includes(category)
    ) {

      console.error(
        "Invalid Vision AI category:",
        generatedText
      );


      return jsonResponse(
        {
          success: false,
          error:
            "AI could not match the image to a valid service."
        },
        500
      );

    }


    /* =========================
       CONFIDENCE
    ========================= */

    let confidence =
      Number.parseInt(
        confidenceMatch?.[1] || "0",
        10
      );


    confidence =
      Math.max(
        0,
        Math.min(100, confidence)
      );


    const explanation =
      explanationMatch?.[1]?.trim() ||
      "This service appears to be the closest match for the uploaded image.";


    /* =========================
       SUCCESS RESPONSE
    ========================= */

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
      "AI image diagnosis error:",
      error
    );


    return jsonResponse(
      {
        success: false,

        error:
          error?.message ||
          "Vision AI is temporarily unavailable."
      },
      500
    );

  }

}


/* =========================
   JSON RESPONSE HELPER
========================= */

function jsonResponse(
  data,
  status = 200
) {

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