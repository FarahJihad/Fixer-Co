function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}


function getCookie(request, name) {
  const cookieHeader =
    request.headers.get("Cookie") || "";

  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] =
      cookie.trim().split("=");

    if (key === name) {
      return decodeURIComponent(
        valueParts.join("=")
      );
    }
  }

  return null;
}


async function getCurrentUser(request, env) {

  const sessionId =
    getCookie(
      request,
      "fixer_session"
    );

  if (!sessionId) {
    return null;
  }


  const session =
    await env.DB
      .prepare(`
        SELECT
          users.id,
          users.name,
          users.username,
          users.email,
          users.phone,
          sessions.expires_at
        FROM sessions
        JOIN users
          ON users.id = sessions.user_id
        WHERE sessions.id = ?
        LIMIT 1
      `)
      .bind(sessionId)
      .first();


  if (!session) {
    return null;
  }


  const expiresAt =
    new Date(
      session.expires_at
        .replace(" ", "T") + "Z"
    );


  if (
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt <= new Date()
  ) {

    await env.DB
      .prepare(`
        DELETE FROM sessions
        WHERE id = ?
      `)
      .bind(sessionId)
      .run();

    return null;
  }


  return session;
}


export async function onRequestGet(context) {

  const {
    request,
    env,
    params
  } = context;


  try {

    /* ================================
       CHECK LOGIN
    ================================= */

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
            "You must be logged in."
        },
        401
      );

    }


    /* ================================
       REQUEST ID
    ================================= */

    const requestId =
      Number(params.id);


    if (
      !Number.isInteger(requestId) ||
      requestId <= 0
    ) {

      return jsonResponse(
        {
          success: false,
          message:
            "Invalid request ID."
        },
        400
      );

    }


    /* ================================
       GET SERVICE REQUEST
    ================================= */

    const serviceRequest =
      await env.DB
        .prepare(`
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
            t.latitude AS technician_latitude,
            t.longitude AS technician_longitude,
            t.starting_price

          FROM service_requests sr

          LEFT JOIN services s
            ON s.id = sr.service_id

          LEFT JOIN technicians t
            ON t.id = sr.technician_id

          WHERE
            sr.id = ?
            AND sr.user_id = ?

          LIMIT 1
        `)
        .bind(
          requestId,
          user.id
        )
        .first();


    /* ================================
       REQUEST NOT FOUND
    ================================= */

    if (!serviceRequest) {

      return jsonResponse(
        {
          success: false,
          message:
            "Service request not found."
        },
        404
      );

    }


    /* ================================
       SUCCESS
    ================================= */

    return jsonResponse({
      success: true,

      request: serviceRequest
    });


  } catch (error) {

    console.error(
      "Track request API error:",
      error
    );


    return jsonResponse(
      {
        success: false,
        message:
          "Unable to load service request."
      },
      500
    );

  }

}