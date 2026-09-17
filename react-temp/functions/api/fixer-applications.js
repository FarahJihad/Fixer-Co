// ========================================
// FIXER APPLICATIONS API
// POST /api/fixer-applications
// ========================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Read a cookie from the request.
function getCookie(request, name) {
  const cookieHeader =
    request.headers.get("Cookie") || "";

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...valueParts] =
      cookie.trim().split("=");

    if (key === name) {
      return valueParts.join("=");
    }
  }

  return null;
}

// Verify the server-side session.
async function getCurrentUser(request, env) {
  const sessionToken = getCookie(
    request,
    "fixer_session"
  );

  if (!sessionToken) {
    return null;
  }

  const session = await env.DB
    .prepare(`
      SELECT
        sessions.id,
        sessions.user_id,
        sessions.expires_at
      FROM sessions
      WHERE sessions.id = ?
      LIMIT 1
    `)
    .bind(sessionToken)
    .first();

  if (!session) {
    return null;
  }

  const expiresAt = new Date(
    session.expires_at
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
      .bind(sessionToken)
      .run();

    return null;
  }

  return {
    id: session.user_id,
  };
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Check the database binding.
    if (!env.DB) {
      return jsonResponse(
        {
          success: false,
          error:
            "Database connection is not configured.",
        },
        500
      );
    }

    // Reject unauthenticated requests.
    const user = await getCurrentUser(
      request,
      env
    );

    if (!user) {
      return jsonResponse(
        {
          success: false,
          error:
            "You must log in before applying as a fixer.",
        },
        401
      );
    }

    // Parse the request body.
    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error: "Invalid request body.",
        },
        400
      );
    }

    const {
      name,
      phone,
      email,
      service_id,
      location,
      experience,
      price,
      available,
      bio,
      policy_accepted,
    } = body;

    // Validate required fields.
    if (
      !name ||
      !phone ||
      !email ||
      !service_id ||
      !location ||
      experience === "" ||
      experience === null ||
      price === "" ||
      price === null ||
      !policy_accepted
    ) {
      return jsonResponse(
        {
          success: false,
          error: "Missing required fields.",
        },
        400
      );
    }

    // Save the application after authentication.
    await env.DB
      .prepare(`
        INSERT INTO fixer_applications
        (
          name,
          phone,
          email,
          service_id,
          location,
          experience,
          price,
          available,
          bio,
          policy_accepted,
          status
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, 'pending'
        )
      `)
      .bind(
        name.trim(),
        phone.trim(),
        email.trim(),
        Number(service_id),
        location.trim(),
        Number(experience),
        Number(price),
        available ? 1 : 0,
        bio ? bio.trim() : null,
        policy_accepted ? 1 : 0
      )
      .run();

    return jsonResponse(
      {
        success: true,
        message:
          "Fixer application submitted successfully.",
      },
      201
    );
  } catch (error) {
    console.error(
      "Fixer application error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          "Could not submit fixer application.",
      },
      500
    );
  }
}