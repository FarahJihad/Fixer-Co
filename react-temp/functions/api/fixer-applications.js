export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const {
      name,
      phone,
      email,
      service_id,
      location,
      experience,
      starting_price,
      availability,
      bio,
      policy_accepted
    } = body;

    if (
      !name ||
      !phone ||
      !email ||
      !service_id ||
      !location ||
      !policy_accepted
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields."
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    await context.env.DB
      .prepare(`
        INSERT INTO fixer_applications
        (
          name,
          phone,
          email,
          service_id,
          location,
          experience,
          starting_price,
          availability,
          bio,
          policy_accepted,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `)
      .bind(
        name,
        phone,
        email,
        Number(service_id),
        location,
        experience || null,
        starting_price ? Number(starting_price) : null,
        availability || null,
        bio || null,
        policy_accepted ? 1 : 0
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fixer application submitted successfully."
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Could not submit fixer application."
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