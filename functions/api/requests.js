export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const {
      customer_name,
      phone,
      service_id,
      technician_id,
      problem
    } = body;

    if (!customer_name || !phone || !service_id || !problem) {
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
        INSERT INTO service_requests
        (
          customer_name,
          phone,
          service_id,
          technician_id,
          problem
        )
        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        customer_name,
        phone,
        Number(service_id),
        technician_id ? Number(technician_id) : null,
        problem
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Service request submitted successfully."
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
        error: "Could not submit service request."
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