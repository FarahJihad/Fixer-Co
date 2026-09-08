// ========================================
// LOGIN API
// POST /api/login
// ========================================


// Create JSON response
function jsonResponse(data, status = 200, extraHeaders = {}) {
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


// ========================================
// HEX TO BUFFER
// ========================================

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] =
      parseInt(
        hex.substring(i, i + 2),
        16
      );
  }

  return bytes;
}


// ========================================
// BUFFER TO HEX
// ========================================

function bufferToHex(buffer) {
  return Array.from(
    new Uint8Array(buffer)
  )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// ========================================
// VERIFY PASSWORD
// ========================================

async function verifyPassword(
  password,
  storedPassword
) {

  if (
    !storedPassword ||
    !storedPassword.startsWith("pbkdf2$")
  ) {
    return false;
  }


  const parts =
    storedPassword.split("$");


  if (parts.length !== 4) {
    return false;
  }


  const algorithm =
    parts[0];

  const iterations =
    Number(parts[1]);

  const saltHex =
    parts[2];

  const storedHash =
    parts[3];


  if (
    algorithm !== "pbkdf2" ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !saltHex ||
    !storedHash
  ) {
    return false;
  }


  const encoder =
    new TextEncoder();


  const passwordKey =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      {
        name: "PBKDF2"
      },
      false,
      [
        "deriveBits"
      ]
    );


  const salt =
    hexToUint8Array(
      saltHex
    );


  const hashBuffer =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256"
      },
      passwordKey,
      256
    );


  const calculatedHash =
    bufferToHex(
      hashBuffer
    );


  return calculatedHash === storedHash;
}


// ========================================
// CREATE RANDOM SESSION TOKEN
// ========================================

function createSessionToken() {

  const randomBytes =
    crypto.getRandomValues(
      new Uint8Array(32)
    );


  return Array.from(
    randomBytes
  )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}


// ========================================
// POST /api/login
// ========================================

export async function onRequestPost(context) {

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


    // ========================================
    // LOGIN DATA
    // ========================================

    const username =
      body.username
        ?.trim()
        .toLowerCase();

    const password =
      body.password;


    if (
      !username ||
      !password
    ) {

      return jsonResponse(
        {
          success: false,
          message:
            "Username and password are required."
        },
        400
      );

    }


    // ========================================
    // FIND USER
    // ========================================

    const user =
      await env.DB
        .prepare(
          `
          SELECT
            id,
            name,
            username,
            email,
            phone,
            password
          FROM users
          WHERE LOWER(username) = ?
          LIMIT 1
          `
        )
        .bind(username)
        .first();


    // Use same error for username/password
    // so we do not reveal which one is wrong
    if (!user) {

      return jsonResponse(
        {
          success: false,
          message:
            "Invalid username or password."
        },
        401
      );

    }


    // ========================================
    // VERIFY PASSWORD
    // ========================================

    const passwordIsValid =
      await verifyPassword(
        password,
        user.password
      );


    if (!passwordIsValid) {

      return jsonResponse(
        {
          success: false,
          message:
            "Invalid username or password."
        },
        401
      );

    }


    // ========================================
    // CREATE SESSION
    // ========================================

    const sessionToken =
      createSessionToken();


    const expiresAt =
      new Date(
        Date.now() +
        7 * 24 * 60 * 60 * 1000
      );


    // Remove old expired sessions
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
        user.id,
        expiresAt.toISOString()
      )
      .run();


    // ========================================
    // SESSION COOKIE
    // ========================================

    const cookie =
      [
        `fixer_session=${sessionToken}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${7 * 24 * 60 * 60}`
      ].join("; ");


    // ========================================
    // SUCCESS
    // ========================================

    return jsonResponse(
      {
        success: true,

        message:
          "Login successful.",

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
            user.phone
        }
      },
      200,
      {
        "Set-Cookie": cookie
      }
    );


  } catch (error) {

    console.error(
      "Login error:",
      error
    );


    return jsonResponse(
      {
        success: false,

        message:
          "Something went wrong while logging in.",

        // Temporary while we test
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );

  }

}