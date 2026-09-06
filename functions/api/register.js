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

  const encoder =
    new TextEncoder();


  // Random salt
  const salt =
    crypto.getRandomValues(
      new Uint8Array(16)
    );


  // Import password
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


  // Create hash
  const hashBuffer =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 210000,
        hash: "SHA-256"
      },
      passwordKey,
      256
    );


  return {
    salt:
      bufferToHex(
        salt.buffer
      ),

    hash:
      bufferToHex(
        hashBuffer
      )
  };
}


// ========================================
// POST /api/register
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

    } catch (error) {

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
    // USER DATA
    // ========================================

    const name =
      body.name?.trim();

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
      !email ||
      !password
    ) {

      return jsonResponse(
        {
          success: false,
          message:
            "Name, email and password are required."
        },
        400
      );

    }


    // ========================================
    // EMAIL VALIDATION
    // ========================================

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailPattern.test(email)
    ) {

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


      if (
        !phonePattern.test(phone)
      ) {

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
    // CHECK EXISTING USER
    // ========================================

    const existingUser =
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


    if (existingUser) {

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
    // HASH PASSWORD
    // ========================================

    const passwordData =
      await hashPassword(
        password
      );


    const storedPassword =
      `pbkdf2$210000$${passwordData.salt}$${passwordData.hash}`;


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
            email,
            phone,
            password_hash
          )
          VALUES (?, ?, ?, ?)
          `
        )
        .bind(
          name,
          email,
          phone,
          storedPassword
        )
        .run();


    // ========================================
    // SUCCESS
    // ========================================

    return jsonResponse(
      {
        success: true,

        message:
          "Account created successfully.",

        user: {
          id:
            result.meta?.last_row_id,

          name:
            name,

          email:
            email,

          phone:
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


    // Temporary debugging error
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