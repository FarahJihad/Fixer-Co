export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const {
      name,
      email,
      phone,
      subject,
      message
    } = body;

    if (!name || !email || !message) {
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
        INSERT INTO contact_messages
        (
          name,
          email,
          phone,
          subject,
          message
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        name,
        email,
        phone || null,
        subject || null,
        message
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message sent successfully."
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
        error: "Could not send message."
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