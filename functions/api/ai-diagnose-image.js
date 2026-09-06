export async function onRequestPost(context) {

  try {

    const { request, env } = context;


    if (!env.AI) {

      return jsonResponse(
        {
          success: false,
          error: "AI binding is not configured."
        },
        500
      );

    }


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


    if (!image) {

      return jsonResponse(
        {
          success: false,
          error: "Please provide an image."
        },
        400
      );

    }


    if (!image.startsWith("data:image/")) {

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


    const categories = [
      "AC & Cooling",
      "Plumbing",
      "Electrical",
      "Appliances",
      "Carpentry & Furniture",
      "General Maintenance"
    ];


    const userPrompt = `
Analyze the uploaded repair image for Fixer.Co.

Your job is to recommend exactly ONE service category.

VALID CATEGORIES:

AC & Cooling
Plumbing
Electrical
Appliances
Carpentry & Furniture
General Maintenance

Rules:

- Choose exactly one category.
- Never invent another category.
- Use only what is visible in the image.
- If the customer provides a description, use it together with the image.
- If the image is unclear, lower the confidence.
- Do not claim damage that cannot be seen.
- Washing machines, refrigerators, ovens, dryers, microwaves and dishwashers are Appliances.
- Pipes, sinks, faucets, toilets, drains and water leaks are Plumbing.
- Air conditioners and AC units are AC & Cooling.
- Wiring, outlets, switches, breakers and electrical problems are Electrical.
- Wooden furniture, cabinets, doors, tables and chairs are Carpentry & Furniture.
- Use General Maintenance only when no other category clearly fits.

Customer description:
${problem || "No written description provided."}

Return ONLY:

CATEGORY: exact category name
CONFIDENCE: number from 0 to 100
EXPLANATION: one short explanation
`;


    /*
      Current Cloudflare Vision format:
      messages + image
    */
    const aiPromise =
      env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {
          messages: [
            {
              role: "system",
              content:
                "You are a visual service classifier for Fixer.Co."
            },
            {
              role: "user",
              content: userPrompt
            }
          ],

          image,

          max_tokens: 120,

          temperature: 0
        }
      );


    /*
      Prevent the request from hanging forever.
    */
    const timeoutPromise =
      new Promise(
        (_, reject) => {

          setTimeout(
            () => {

              reject(
                new Error(
                  "Vision AI request timed out."
                )
              );

            },
            25000
          );

        }
      );


    const aiResult =
      await Promise.race([
        aiPromise,
        timeoutPromise
      ]);


    console.log(
      "Vision AI raw result:",
      JSON.stringify(aiResult)
    );


    const generatedText =
      aiResult?.response ||
      aiResult?.result ||
      aiResult?.choices?.[0]?.text ||
      "";


    if (!generatedText) {

      return jsonResponse(
        {
          success: false,
          error:
            "Vision AI returned no readable response."
        },
        500
      );

    }


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


    if (
      !category ||
      !categories.includes(category)
    ) {

      console.error(
        "Invalid Vision AI response:",
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
      "This appears to be the closest service match.";


    return jsonResponse(
      {
        success: true,

        diagnosis: {
          category,
          confidence,
          explanation
        }
      }
    );


  } catch (error) {

    console.error(
      "Vision AI error:",
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