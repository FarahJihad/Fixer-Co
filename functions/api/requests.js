// ========================================
// SERVICE REQUESTS API
// POST /api/requests
// ========================================


// Create JSON response
function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}


// ========================================
// GET COOKIE
// ========================================

function getCookie(
  request,
  name
) {

  const cookieHeader =
    request.headers.get("Cookie") || "";

  const cookies =
    cookieHeader.split(";");


  for (const cookie of cookies) {

    const [
      key,
      ...valueParts
    ] =
      cookie.trim().split("=");


    if (key === name) {

      return valueParts.join("=");

    }

  }


  return null;
}


// ========================================
// GET LOGGED-IN USER
// ========================================

async function getCurrentUser(
  request,
  env
) {

  const sessionToken =
    getCookie(
      request,
      "fixer_session"
    );


  if (!sessionToken) {
    return null;
  }


  const session =
    await env.DB
      .prepare(
        `
        SELECT
          sessions.id,
          sessions.user_id,
          sessions.expires_at,
          users.name,
          users.username,
          users.email,
          users.phone
        FROM sessions
        JOIN users
          ON users.id = sessions.user_id
        WHERE sessions.id = ?
        LIMIT 1
        `
      )
      .bind(sessionToken)
      .first();


  if (!session) {
    return null;
  }


  const expiresAt =
    new Date(
      session.expires_at
    );


  if (
    Number.isNaN(
      expiresAt.getTime()
    ) ||
    expiresAt <= new Date()
  ) {

    await env.DB
      .prepare(
        `
        DELETE FROM sessions
        WHERE id = ?
        `
      )
      .bind(sessionToken)
      .run();


    return null;
  }


  return {
    id:
      session.user_id,

    name:
      session.name,

    username:
      session.username,

    email:
      session.email,

    phone:
      session.phone
  };
}


// ========================================
// POST /api/requests
// ========================================

export async function onRequestPost(
  context
) {

  try {

    const {
      request,
      env
    } = context;


    // ========================================
    // DATABASE CHECK
    // ========================================

    if (!env.DB) {

      return jsonResponse(
        {
          success: false,
          message:
            "Database connection is not configured."
        },
        500
      );

    }


    // ========================================
    // AUTHENTICATION
    // ========================================

    const user =
      await getCurrentUser(
        request,
        env
      );


    if (!user) {

      return jsonResponse(
        {
          success: false,
          message:
            "You must log in before requesting a service."
        },
        401
      );

    }


    // ========================================
    // READ REQUEST BODY
    // ========================================

    let body;


    try {

      body =
        await request.json();

    } catch {

      return jsonResponse(
        {
          success: false,
          message:
            "Invalid request body."
        },
        400
      );

    }


    const {
      customer_name,
      phone,
      service_id,
      technician_id,
      problem
    } = body;


    // ========================================
    // VALIDATION
    // ========================================

    if (
      !customer_name ||
      !phone ||
      !service_id ||
      !problem
    ) {

      return jsonResponse(
        {
          success: false,
          message:
            "Missing required fields."
        },
        400
      );

    }


    if (
      !/^05\d{8}$/.test(
        phone.trim()
      )
    ) {

      return jsonResponse(
        {
          success: false,
          message:
            "Please enter a valid Saudi phone number."
        },
        400
      );

    }


    // ========================================
    // SAVE REQUEST
    // ========================================

    const result =
      await env.DB
        .prepare(
          `
          INSERT INTO service_requests
          (
            customer_name,
            phone,
            service_id,
            technician_id,
            problem,
            user_id,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `
        )
        .bind(
          customer_name.trim(),
          phone.trim(),
          Number(service_id),

          technician_id
            ? Number(technician_id)
            : null,

          problem.trim(),

          user.id,

          "requested"
        )
        .run();


    // ========================================
    // SUCCESS
    // ========================================

    return jsonResponse(
      {
        success: true,

        message:
          "Service request submitted successfully.",

        request_id:
          result.meta?.last_row_id ?? null
      },
      201
    );


  } catch (error) {

    console.error(
      "Service request error:",
      error
    );


    return jsonResponse(
      {
        success: false,

        message:
          "Could not submit service request.",

        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );

  }

}