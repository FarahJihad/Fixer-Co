export async function onRequestGet(context) {

  try {

    const { env } = context;

    if (!env.AI) {
      return Response.json(
        {
          success: false,
          error: "AI binding is missing."
        },
        {
          status: 500
        }
      );
    }


    /*
      Accept the Meta license for
      Llama 3.2 Vision.

      This endpoint is temporary
      and will be deleted after use.
    */
    const result = await env.AI.run(
      "@cf/meta/llama-3.2-11b-vision-instruct",
      {
        prompt: "agree"
      }
    );


    return Response.json({
      success: true,
      message: "Vision AI license accepted.",
      result
    });


  } catch (error) {

    console.error(
      "Vision license error:",
      error
    );


    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Could not accept the Vision AI license."
      },
      {
        status: 500
      }
    );

  }

}