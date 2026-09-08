// ========================================
// GOOGLE LOGIN API
// POST /api/google-login
// ========================================


// ========================================
// JSON RESPONSE
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
        ...extraHeaders,
      },
    }
  );
}


// ========================================
// RANDOM HEX
// ========================================

function randomHex(byteLength = 32) {
  const bytes =
    crypto.getRandomValues(
      new Uint8Array(byteLength)
    );

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}


// ========================================
// BUFFER TO HEX
// ========================================

function bufferToHex(buffer) {
  return Array.from(
    new Uint8Array(buffer)
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0")
    )
    .join("");
}


// ========================================
// CREATE PASSWORD FOR GOOGLE ACCOUNT
// ========================================

async function createUnusablePassword() {
  const randomPassword =
    randomHex(32);

  const salt =
    crypto.getRandomValues(
      new Uint8Array(16)
    );

  const encoder =
    new TextEncoder();

  const passwordKey =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(randomPassword),
      {
        name: "PBKDF2",
      },
      false,
      ["deriveBits"]
    );

  const hashBuffer =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      256
    );

  return (
    `pbkdf2$100000$` +
    `${bufferToHex(salt.buffer)}$` +
    `${bufferToHex(hashBuffer)}`
  );
}


// ========================================
// CLEAN USERNAME
// ========================================

function cleanUsernameBase(value) {
  const cleaned =
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .replace(/^[._]+|[._]+$/g, "")
      .slice(0, 16);

  return cleaned || "fixeruser";
}


// ========================================
// CREATE UNIQUE USERNAME
// ========================================

async function createUniqueUsername(
  env,
  email
) {
  const emailBase =
    email.split("@")[0];

  const base =
    cleanUsernameBase(emailBase);

  let username = base;
  let counter = 1;

  while (true) {
    const existing =
      await env.DB
        .prepare(
          `
          SELECT id
          FROM users
          WHERE LOWER(username) = ?
          LIMIT 1
          `
        )
        .bind(
          username.toLowerCase()
        )
        .first();

    if (!existing) {
      return username;
    }

    const suffix =
      String(counter);

    username = (
      base.slice(
        0,
        Math.max(
          3,
          20 - suffix.length
        )
      ) + suffix
    ).slice(0, 20);

    counter++;
  }
}


// ========================================
// VERIFY GOOGLE ACCESS TOKEN
// ========================================

async function verifyGoogleAccessToken(
  accessToken,
  clientId
) {
  // Check token information
  const tokenInfoResponse =
    await fetch(
      "https://oauth2.googleapis.com/tokeninfo" +
      `?access_token=${encodeURIComponent(
        accessToken
      )}`
    );

  if (!tokenInfoResponse.ok) {
    throw new Error(
      "Invalid Google access token."
    );
  }

  const tokenInfo =
    await tokenInfoResponse.json();


  // Make sure token belongs to our Google client
  if (
    tokenInfo.aud &&
    tokenInfo.aud !== clientId
  ) {
    throw new Error(
      "Google token was issued for a different application."
    );
  }


  // ========================================
  // GET GOOGLE USER PROFILE
  // ========================================

  const userInfoResponse =
    await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  if (!userInfoResponse.ok) {
    throw new Error(
      "Unable to get Google account information."
    );
  }

  const googleUser =
    await userInfoResponse.json();


  // ========================================
  // EMAIL CHECKS
  // ========================================

  if (!googleUser.email) {
    throw new Error(
      "Google did not provide an email address."
    );
  }

  if (
    googleUser.email_verified === false
  ) {
    throw new Error(
      "Your Google email address is not verified."
    );
  }


  return googleUser;
}


// ========================================
// CREATE FIXER.CO SESSION
// ========================================

async function createSession(
  env,
  userId
) {
  const sessionToken =
    randomHex(32);

  const expiresAt =
    new Date(
      Date.now() +
      7 * 24 * 60 * 60 * 1000
    );


  // Delete expired sessions
  await env.DB
    .prepare(
      `
      DELETE FROM sessions
      WHERE expires_at <= ?
      `
    )
    .bind(
      new Date().toISOString()
    )
    .run();


  // Save new session
  await env.DB
    .prepare(
      `
      INSERT INTO sessions
      (
        id,
        user_id,
        expires_at
      )
      VALUES (?, ?, ?)
      `
    )
    .bind(
      sessionToken,
      userId,
      expiresAt.toISOString()
    )
    .run();


  const cookie = [
    `fixer_session=${sessionToken}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${7 * 24 * 60 * 60}`,
  ].join("; ");


  return {
    token: sessionToken,
    cookie,
  };
}


// ========================================
// POST /api/google-login
// ========================================

export async function onRequestPost(
  context
) {
  try {
    const {
      request,
      env,
    } = context;


    // ========================================
    // DATABASE CHECK
    // ========================================

    if (!env.DB) {
      return jsonResponse(
        {
          success: false,
          message:
            "Database connection is not configured.",
        },
        500
      );
    }


    // ========================================
    // GOOGLE CLIENT ID CHECK
    // ========================================

    if (!env.GOOGLE_CLIENT_ID) {
      return jsonResponse(
        {
          success: false,
          message:
            "Google login is not configured on the server.",
        },
        500
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
            "Invalid request body.",
        },
        400
      );
    }


    // ========================================
    // ACCESS TOKEN
    // ========================================

    const accessToken =
      body.access_token;


    if (!accessToken) {
      return jsonResponse(
        {
          success: false,
          message:
            "Google access token is required.",
        },
        400
      );
    }


    // ========================================
    // VERIFY GOOGLE TOKEN
    // ========================================

    let googleUser;

    try {
      googleUser =
        await verifyGoogleAccessToken(
          accessToken,
          env.GOOGLE_CLIENT_ID
        );
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Invalid Google access token.",
        },
        401
      );
    }


    // ========================================
    // GOOGLE USER DATA
    // ========================================

    const email =
      googleUser.email
        .trim()
        .toLowerCase();

    const name =
      String(
        googleUser.name ||
        email.split("@")[0] ||
        "Fixer.Co User"
      ).trim();


    // ========================================
    // FIND EXISTING USER BY EMAIL
    // ========================================

    let user =
      await env.DB
        .prepare(
          `
          SELECT
            id,
            name,
            username,
            email,
            phone
          FROM users
          WHERE LOWER(email) = ?
          LIMIT 1
          `
        )
        .bind(email)
        .first();


    // ========================================
    // FIRST GOOGLE LOGIN
    // CREATE ACCOUNT AUTOMATICALLY
    // ========================================

    if (!user) {
      const username =
        await createUniqueUsername(
          env,
          email
        );

      const password =
        await createUnusablePassword();


      const result =
        await env.DB
          .prepare(
            `
            INSERT INTO users
            (
              name,
              username,
              email,
              phone,
              password
            )
            VALUES (?, ?, ?, ?, ?)
            `
          )
          .bind(
            name,
            username,
            email,
            null,
            password
          )
          .run();


      user = {
        id:
          result.meta?.last_row_id,

        name,
        username,
        email,

        phone:
          null,
      };
    }


    // ========================================
    // CREATE SESSION
    // ========================================

    const session =
      await createSession(
        env,
        user.id
      );


    // ========================================
    // SUCCESS
    // ========================================

    return jsonResponse(
      {
        success: true,

        authenticated: true,

        message:
          "Google login successful.",

        user: {
          id:
            user.id,

          name:
            user.name,

          username:
            user.username,

          email:
            user.email,

          phone:
            user.phone,
        },
      },
      200,
      {
        "Set-Cookie":
          session.cookie,
      }
    );


  } catch (error) {
    console.error(
      "Google login error:",
      error
    );


    return jsonResponse(
      {
        success: false,

        message:
          "Something went wrong while signing in with Google.",

        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500
    );
  }
}