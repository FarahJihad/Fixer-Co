// ========================================
// CURRENT USER API
// GET /api/me
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

function getCookie(request, name) {
  const cookieHeader =
    request.headers.get("Cookie") || "";

  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] =
      cookie.trim().split("=");

    if (key === name) {
      return valueParts.join("=");
    }
  }

  return null;
}

export async function onRequestGet(context) {
  try {
    const { request, env } = context;

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

    const sessionToken =
      getCookie(
        request,
        "fixer_session"
      );

    if (!sessionToken) {
      return jsonResponse(
        {
          success: false,
          authenticated: false
        },
        401
      );
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
      return jsonResponse(
        {
          success: false,
          authenticated: false
        },
        401
      );
    }

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
          authenticated: false
        },
        401
      );
    }

    return jsonResponse(
      {
        success: true,
        authenticated: true,

        user: {
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
        }
      },
      200
    );

  } catch (error) {
    console.error(
      "Me error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        authenticated: false,
        message:
          "Unable to get current user."
      },
      500
    );
  }
}