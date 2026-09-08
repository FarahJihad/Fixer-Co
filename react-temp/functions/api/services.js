export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB
      .prepare("SELECT * FROM services ORDER BY id ASC")
      .all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Could not load services."
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