export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    /* Make sure Workers AI binding exists */
    if (!env.AI) {
      return jsonResponse(
        {
          success: false,
          error: "AI binding is not configured."
        },
        500
      );
    }


    /* Read request body */
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


    /* Validate user input */
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
      These are the ONLY valid Fixer.Co categories.
    */
    const categories = [
      "AC & Cooling",
      "Plumbing",
      "Electrical",
      "Appliances",
      "Carpentry & Furniture",
      "General Maintenance"
    ];


    /*
      Stronger classification prompt.

      UNKNOWN is used when the user's text
      cannot be meaningfully classified.
    */
    const prompt = `
You are the AI service classifier for Fixer.Co.

Your task is to classify a customer's home repair problem into ONE Fixer.Co service category.

If the customer's description is meaningless, random, unrelated to home repair, or does not provide enough information to identify a service, return UNKNOWN instead of guessing.

VALID CATEGORIES:

1. AC & Cooling
Use for:
- air conditioner
- AC unit
- cooling problems
- warm air from AC
- AC not turning on
- AC leaking
- thermostat related to AC

2. Plumbing
Use for:
- water leaks
- sinks
- toilets
- faucets
- pipes
- drains
- water pressure
- clogged plumbing

3. Electrical
Use for:
- electrical outlets
- sockets
- switches
- wiring
- lights
- electricity
- circuit breakers
- power problems in the house

4. Appliances
Use for:
- washing machines
- dryers
- refrigerators
- freezers
- ovens
- microwaves
- dishwashers
- other home appliances

5. Carpentry & Furniture
Use for:
- wooden doors
- cabinets
- tables
- chairs
- shelves
- furniture
- carpentry
- broken wooden parts

6. General Maintenance
Use for:
- general home repairs
- wall damage
- minor maintenance
- problems that do not clearly belong to the other categories


IMPORTANT EXAMPLES:

"My washing machine stopped working."
CATEGORY: Appliances

"My refrigerator is not cooling."
CATEGORY: Appliances

"My AC is running but the room is still hot."
CATEGORY: AC & Cooling

"There is water leaking under my kitchen sink."
CATEGORY: Plumbing

"The electrical outlet stopped working."
CATEGORY: Electrical

"The leg of my wooden table is broken."
CATEGORY: Carpentry & Furniture


UNKNOWN EXAMPLES:

"asdfgh"
CATEGORY: UNKNOWN

"hello banana"
CATEGORY: UNKNOWN

"I don't know"
CATEGORY: UNKNOWN

"something is wrong"
CATEGORY: UNKNOWN

"?????"
CATEGORY: UNKNOWN


VERY IMPORTANT RULES:

- Choose ONE valid category only when there is enough information to identify the service.
- If the description is meaningless, random, unrelated to home repair, or too vague, return CATEGORY: UNKNOWN.
- Never guess a service when there is not enough information.
- Never invent a new category other than UNKNOWN.
- General Maintenance must only be used for an actual home maintenance or repair problem.
- Do NOT use General Maintenance as a fallback for meaningless or unrelated text.
- Washing machines, refrigerators, ovens, dryers and dishwashers are Appliances.
- Do NOT classify a refrigerator as AC & Cooling.
- Do NOT classify a washing machine as AC & Cooling.
- AC & Cooling is ONLY for air-conditioning and cooling-system service problems.
- The CATEGORY must agree with the EXPLANATION.
- If your explanation says the problem is NOT related to a category, you MUST NOT select that category.
- Confidence must be an integer from 0 to 98.
- If the problem is unclear, return UNKNOWN instead of guessing.
- Give one short explanation.
- This is a service recommendation, not a guaranteed technical diagnosis.


CUSTOMER PROBLEM:

"${problem}"


Return ONLY these three lines:

CATEGORY: exact category name OR UNKNOWN
CONFIDENCE: number
EXPLANATION: one short explanation
`;


    /*
      Call Cloudflare Workers AI.
    */
    const aiResult = await env.AI.run(
      "@cf/meta/llama-3.2-3b-instruct",
      {
        prompt,
        max_tokens: 120,
        temperature: 0
      }
    );


    /*
      Read generated model text.
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
      Extract category, confidence and explanation.
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
      Handle UNKNOWN separately.

      This is not a server error.
      It simply means the AI does not have
      enough information to recommend a service.
    */
    if (
      category &&
      category.toUpperCase() === "UNKNOWN"
    ) {
      return jsonResponse({
        success: true,

        diagnosis: {
          category: "UNKNOWN",
          confidence: 0,
          explanation:
            "We couldn't clearly identify a home repair issue from that description."
        }
      });
    }


    /*
      Never trust an AI response without validation.
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


    /*
      Keep confidence safely between 0 and 98.
    */
    let confidence =
      Number.parseInt(
        confidenceMatch?.[1] || "0",
        10
      );

    confidence = Math.max(
      0,
      Math.min(98, confidence)
    );


    const explanation =
      explanationMatch?.[1]?.trim() ||
      "This service appears to be the closest match for your problem.";


    /*
      Extra consistency protection.

      This prevents clearly impossible category mistakes
      for common appliance descriptions.
    */
    const lowerProblem =
      problem.toLowerCase();

    const applianceTerms = [
      "washing machine",
      "washer",
      "dryer",
      "refrigerator",
      "fridge",
      "freezer",
      "oven",
      "microwave",
      "dishwasher"
    ];


    const clearlyAppliance =
      applianceTerms.some(
        (term) =>
          lowerProblem.includes(term)
      );


    let finalCategory = category;
    let finalConfidence = confidence;
    let finalExplanation = explanation;


    /*
      If the user explicitly names a common appliance,
      ensure the final service is Appliances.

      AI still handles the diagnosis and explanation,
      but this prevents contradictory outputs.
    */
    if (
      clearlyAppliance &&
      category !== "Appliances"
    ) {
      finalCategory = "Appliances";

      finalConfidence =
        Math.min(
          98,
          Math.max(confidence, 90)
        );

      finalExplanation =
        "The problem involves a home appliance, so Appliances is the best service match.";
    }


    return jsonResponse({
      success: true,

      diagnosis: {
        category: finalCategory,
        confidence: finalConfidence,
        explanation: finalExplanation
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
  Helper for returning JSON responses.
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