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
       READ REQUEST BODY
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
      The frontend sends the image
      as a Base64 Data URL.
    */
    if (
      !/^data:image\/(jpeg|jpg|png|webp);base64,/i
        .test(image)
    ) {

      return jsonResponse(
        {
          success: false,
          error: "Invalid image format."
        },
        400
      );

    }


    /* =========================
       VALIDATE DESCRIPTION
    ========================= */

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
       FIXER.CO CATEGORIES
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
       VISION AI PROMPT
    ========================= */

    const prompt = `
Look at the uploaded home-repair image.

Choose the ONE Fixer.Co service that best matches what is visible.

Allowed services:

AC & Cooling
Plumbing
Electrical
Appliances
Carpentry & Furniture
General Maintenance

Examples:

- sink, pipe, faucet, toilet, drain or water leak = Plumbing

- AC or air conditioner = AC & Cooling

- outlet, switch, wire or breaker = Electrical

- washing machine, refrigerator, oven or dishwasher = Appliances

- wooden door, cabinet, chair or table = Carpentry & Furniture

- another home repair that does not clearly fit above = General Maintenance


Customer description:

${problem || "No written description provided."}


Rules:

- Use the uploaded image as the main evidence.

- Choose exactly one allowed service ONLY if the image clearly matches a home-repair issue.
- If the image is unrelated to home repair, too unclear, too dark, or does not provide enough evidence, return CATEGORY: UNKNOWN.
- If the image is unclear, use lower confidence.
- Do not invent damage that is not visible.

- Keep the explanation to one short sentence.


Return exactly these three lines:
CATEGORY: exact allowed service OR UNKNOWN
CONFIDENCE: integer from 0 to 100
EXPLANATION: one short sentence
`;


    /* =========================
       RUN CLOUDFLARE VISION AI
    ========================= */

    const aiResult =
      await env.AI.run(
        "@cf/meta/llama-3.2-11b-vision-instruct",
        {

          messages: [

            {
              role: "system",

              content:
                "You classify home repair photos into Fixer.Co service categories."
            },

            {
              role: "user",
              content: prompt
            }

          ],


          image,


          max_tokens: 140,


          temperature: 0

        }
      );


    /* =========================
       READ AI RESPONSE
    ========================= */

    let generatedText = "";


    if (
      typeof aiResult?.response === "string"
    ) {

      generatedText =
        aiResult.response;

    }

    else if (
      typeof aiResult?.result === "string"
    ) {

      generatedText =
        aiResult.result;

    }

    else if (
      typeof aiResult?.choices?.[0]?.text
        === "string"
    ) {

      generatedText =
        aiResult.choices[0].text;

    }


    /*
      Helpful when checking
      Cloudflare Function logs.
    */
    console.log(
      "Vision AI response:",
      generatedText
    );


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


    /* =========================
       FIND CATEGORY
    ========================= */

    /*
      First try to read:

      CATEGORY: Plumbing
    */
/*
  Read the category returned by AI.
*/
const categoryLine =
  generatedText.match(
    /CATEGORY\s*:\s*([^\n\r]+)/i
  )?.[1]?.trim() || "";


/*
  UNKNOWN is a valid result.

  It means the image is unclear,
  unrelated to home repair,
  or does not contain enough evidence.
*/
if (
  categoryLine.toUpperCase() === "UNKNOWN"
) {

  return jsonResponse(
    {
      success: true,

      diagnosis: {
        category: "UNKNOWN",
        confidence: 0,
        explanation:
          "We couldn't clearly identify a home repair issue from this photo."
      }
    },
    200
  );
}


let category =
  matchValidCategory(
    categoryLine,
    categories
  );


    /*
      If the model did not follow
      the exact format, search its
      complete response instead.
    */
    if (!category) {

      category =
        matchValidCategory(
          generatedText,
          categories
        );

    }


    /* =========================
       SEMANTIC FALLBACK
    ========================= */

    /*
      Sometimes the model may say:

      "This appears to be a plumbing issue."

      instead of:

      CATEGORY: Plumbing

      These checks prevent that from
      being rejected as invalid.
    */
    if (!category) {

      const lower =
        generatedText.toLowerCase();


      /* Plumbing */

      if (
        lower.includes("plumb") ||
        lower.includes("pipe") ||
        lower.includes("sink") ||
        lower.includes("faucet") ||
        lower.includes("water leak") ||
        lower.includes("drain")
      ) {

        category =
          "Plumbing";

      }


      /* AC & Cooling */

      else if (
        lower.includes("air conditioner") ||
        lower.includes(" ac ") ||
        lower.includes("cooling")
      ) {

        category =
          "AC & Cooling";

      }


      /* Electrical */

      else if (
        lower.includes("electrical") ||
        lower.includes("outlet") ||
        lower.includes("socket") ||
        lower.includes("wiring") ||
        lower.includes("breaker")
      ) {

        category =
          "Electrical";

      }


      /* Appliances */

      else if (
        lower.includes("appliance") ||
        lower.includes("washing machine") ||
        lower.includes("refrigerator") ||
        lower.includes("fridge") ||
        lower.includes("oven") ||
        lower.includes("dishwasher")
      ) {

        category =
          "Appliances";

      }


      /* Carpentry & Furniture */

      else if (
        lower.includes("carpentry") ||
        lower.includes("furniture") ||
        lower.includes("cabinet") ||
        lower.includes("wooden")
      ) {

        category =
          "Carpentry & Furniture";

      }

    }


    /* =========================
       CATEGORY FAILED
    ========================= */

    if (!category) {

      console.error(
        "Could not map Vision AI output:",
        generatedText
      );


      return jsonResponse(
        {
          success: false,

          error:
            "AI could not confidently match this photo. Try a clearer image or add a short description."
        },
        422
      );

    }


    /* =========================
       CONFIDENCE
    ========================= */

    const confidenceMatch =
      generatedText.match(
        /CONFIDENCE\s*:\s*(\d{1,3})/i
      );


    let confidence =
      Number.parseInt(
        confidenceMatch?.[1] || "80",
        10
      );


    /*
      Keep confidence between
      0 and 100.
    */
    confidence =
      Math.max(
        0,
        Math.min(
          98,
          confidence
        )
      );


    /* =========================
       EXPLANATION
    ========================= */

    const explanation =
      generatedText.match(
        /EXPLANATION\s*:\s*([^\n\r]+)/i
      )?.[1]?.trim() ||

      `The uploaded image most closely matches ${category}.`;


    /* =========================
       SUCCESS
    ========================= */

    return jsonResponse(
      {

        success: true,


        diagnosis: {

          category,

          confidence,

          explanation

        }

      },
      200
    );


  } catch (error) {


    /* =========================
       SERVER / AI ERROR
    ========================= */

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


/* ==================================================
   MATCH VALID FIXER.CO CATEGORY
================================================== */

function matchValidCategory(
  text,
  categories
) {

  /*
    Clean formatting that the AI
    may add accidentally.

    Example:

    **Plumbing**

    becomes:

    plumbing
  */
  const cleaned =
    String(text || "")

      .replace(
        /\*\*/g,
        ""
      )

      .replace(
        /[`"'“”]/g,
        ""
      )

      .replace(
        /\s+/g,
        " "
      )

      .trim()

      .toLowerCase();


  /* =========================
     FULL CATEGORY NAMES
  ========================= */

  for (
    const category of categories
  ) {

    if (
      cleaned.includes(
        category.toLowerCase()
      )
    ) {

      return category;

    }

  }


  /* =========================
     SHORTER AI ANSWERS
  ========================= */


  if (
    /\bplumbing\b/i.test(
      cleaned
    )
  ) {

    return "Plumbing";

  }


  if (
    /\belectrical\b/i.test(
      cleaned
    )
  ) {

    return "Electrical";

  }


  if (
    /\bappliances?\b/i.test(
      cleaned
    )
  ) {

    return "Appliances";

  }


  if (
    /\bcarpentry\b|\bfurniture\b/i
      .test(cleaned)
  ) {

    return "Carpentry & Furniture";

  }


  if (
    /\bgeneral maintenance\b/i
      .test(cleaned)
  ) {

    return "General Maintenance";

  }


  if (
    /\bac\b|\bair conditioning\b|\bcooling\b/i
      .test(cleaned)
  ) {

    return "AC & Cooling";

  }


  return null;

}


/* ==================================================
   JSON RESPONSE HELPER
================================================== */

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