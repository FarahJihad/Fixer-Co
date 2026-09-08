// ========================================
// LOGOUT API
// POST /api/logout
// ========================================

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders
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


export async function onRequestPost(context) {

  try {

    const {
      request,
      env
    } = context;


    const sessionToken =
      getCookie(
        request,
        "fixer_session"
      );


    if (
      sessionToken &&
      env.DB
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

    }


    const expiredCookie =
      [
        "fixer_session=",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=0"
      ].join("; ");


    return jsonResponse(
      {
        success: true,
        message:
          "Logged out successfully."
      },
      200,
      {
        "Set-Cookie":
          expiredCookie
      }
    );


  } catch (error) {

    console.error(
      "Logout error:",
      error
    );


    return jsonResponse(
      {
        success: false,
        message:
          "Unable to log out."
      },
      500
    );

  }

}