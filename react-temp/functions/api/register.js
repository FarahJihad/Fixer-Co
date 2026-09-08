// ========================================
// REGISTER API
// POST /api/register
// ========================================

// Create JSON response
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
// CONVERT BUFFER TO HEX
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
// HASH PASSWORD WITH PBKDF2
// ========================================
async function hashPassword(password) {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const passwordKey =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      {
        name: "PBKDF2"
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
        hash: "SHA-256"
      },
      passwordKey,
      256
    );

  return {
    salt: bufferToHex(salt.buffer),
    hash: bufferToHex(hashBuffer)
  };
}

// ========================================
// POST /api/register
// ========================================
export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.DB) {
      return jsonResponse(
        {
          success: false,
          message: "Database connection is not configured."
        },
        500
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          message: "Invalid request body."
        },
        400
      );
    }

    // ========================================
    // USER DATA
    // ========================================
    const name =
      body.name?.trim();

    const username =
      body.username
        ?.trim()
        .toLowerCase();

    const email =
      body.email
        ?.trim()
        .toLowerCase();

    const phone =
      body.phone?.trim() || null;

    const password =
      body.password;

    // ========================================
    // REQUIRED FIELDS
    // ========================================
    if (
      !name ||
      !username ||
      !email ||
      !password
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Name, username, email and password are required."
        },
        400
      );
    }

    // ========================================
    // USERNAME VALIDATION
    // ========================================
    const usernamePattern =
      /^[a-z0-9._]{3,20}$/;

    if (!usernamePattern.test(username)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Username must be 3-20 characters and contain only letters, numbers, dots, or underscores."
        },
        400
      );
    }

    // ========================================
    // EMAIL VALIDATION
    // ========================================
    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse(
        {
          success: false,
          message:
            "Please enter a valid email address."
        },
        400
      );
    }

    // ========================================
    // PHONE VALIDATION
    // ========================================
    if (phone) {
      const phonePattern =
        /^05\d{8}$/;

      if (!phonePattern.test(phone)) {
        return jsonResponse(
          {
            success: false,
            message:
              "Phone number must be in the format 05XXXXXXXX."
          },
          400
        );
      }
    }

    // ========================================
    // PASSWORD VALIDATION
    // ========================================
    const hasLength =
      password.length >= 8;

    const hasUppercase =
      /[A-Z]/.test(password);

    const hasLowercase =
      /[a-z]/.test(password);

    const hasNumber =
      /[0-9]/.test(password);

    const hasSpecial =
      /[^A-Za-z0-9]/.test(password);

    if (
      !hasLength ||
      !hasUppercase ||
      !hasLowercase ||
      !hasNumber ||
      !hasSpecial
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Password does not meet the required security rules."
        },
        400
      );
    }

    // ========================================
    // CHECK EXISTING EMAIL
    // ========================================
    const existingEmail =
      await env.DB
        .prepare(
          `
          SELECT id
          FROM users
          WHERE email = ?
          LIMIT 1
          `
        )
        .bind(email)
        .first();

    if (existingEmail) {
      return jsonResponse(
        {
          success: false,
          message:
            "An account with this email already exists."
        },
        409
      );
    }

    // ========================================
    // CHECK EXISTING USERNAME
    // ========================================
    const existingUsername =
      await env.DB
        .prepare(
          `
          SELECT id
          FROM users
          WHERE username = ?
          LIMIT 1
          `
        )
        .bind(username)
        .first();

    if (existingUsername) {
      return jsonResponse(
        {
          success: false,
          message:
            "This username is already taken."
        },
        409
      );
    }

    // ========================================
    // HASH PASSWORD
    // ========================================
    const passwordData =
      await hashPassword(password);

    const storedPassword =
      `pbkdf2$100000$${passwordData.salt}$${passwordData.hash}`;

    // ========================================
    // INSERT USER
    // ========================================
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
          phone,
          storedPassword
        )
        .run();

    return jsonResponse(
      {
        success: true,
        message:
          "Account created successfully.",
        user: {
          id:
            result.meta?.last_row_id,
          name,
          username,
          email,
          phone
        }
      },
      201
    );

  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Something went wrong while creating your account.",
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );
  }
}