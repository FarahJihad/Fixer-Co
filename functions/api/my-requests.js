// ========================================
// MY REQUESTS API
// GET /api/my-requests
// ========================================

function jsonResponse(data, status = 200) {
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

function getCookie(request, name) {

  const cookieHeader =
    request.headers.get("Cookie") || "";

  const cookies =
    cookieHeader.split(";");


  for (const cookie of cookies) {

    const [
      key,
      ...valueParts
    ] = cookie.trim().split("=");

    if (key === name) {
      return valueParts.join("=");
    }

  }

  return null;
}


// ========================================
// GET /api/my-requests
// ========================================

export async function onRequestGet(context) {

  try {

    const {
      request,
      env
    } = context;


    if (!env.DB) {

      return jsonResponse(
        {
          success: false,
          message: "Database connection is not configured."
        },
        500
      );

    }


    // ----------------------------------------
    // CHECK LOGIN SESSION
    // ----------------------------------------

    const sessionToken =
      getCookie(
        request,
        "fixer_session"
      );


    if (!sessionToken) {

      return jsonResponse(
        {
          success: false,
          authenticated: false,
          message: "You must log in first."
        },
        401
      );

    }


    const session =
      await env.DB
        .prepare(
          `
          SELECT
            sessions.user_id,
            sessions.expires_at
          FROM sessions
          WHERE sessions.id = ?
          LIMIT 1
          `
        )
        .bind(sessionToken)
        .first();


    if (!session) {

      return jsonResponse(
        {
          success: false,
          authenticated: false,
          message: "Session not found."
        },
        401
      );

    }


    // ----------------------------------------
    // CHECK EXPIRATION
    // ----------------------------------------

    const expiresAt =
      new Date(session.expires_at);


    if (
      Number.isNaN(expiresAt.getTime()) ||
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


      return jsonResponse(
        {
          success: false,
          authenticated: false,
          message: "Session expired."
        },
        401
      );

    }


    // ----------------------------------------
    // GET ONLY THIS USER'S REQUESTS
    // ----------------------------------------

    const result =
      await env.DB
        .prepare(
          `
          SELECT
            sr.id,
            sr.problem,
            sr.status,
            sr.created_at,

            sr.service_id,
            s.name AS service_name,

            sr.technician_id,
            t.name AS technician_name,
            t.rating AS technician_rating,
            t.location AS technician_location,
            t.starting_price

          FROM service_requests AS sr

          LEFT JOIN services AS s
            ON s.id = sr.service_id

          LEFT JOIN technicians AS t
            ON t.id = sr.technician_id

          WHERE sr.user_id = ?

          ORDER BY sr.created_at DESC
          `
        )
        .bind(session.user_id)
        .all();


    return jsonResponse(
      {
        success: true,
        requests: result.results || []
      }
    );


  } catch (error) {

    console.error(
      "My Requests error:",
      error
    );


    return jsonResponse(
      {
        success: false,
        message: "Could not load your requests.",
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );

  }

}