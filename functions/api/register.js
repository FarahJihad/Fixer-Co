// ========================================
// REGISTER API
// POST /api/register
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


// Convert ArrayBuffer to hexadecimal text
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


// Hash password using PBKDF2
async function hashPassword(password) {

  const encoder =
    new TextEncoder();


  // Create random salt
  const salt =
    crypto.getRandomValues(
      new Uint8Array(16)
    );


  // Convert password into CryptoKey
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


  // Generate password hash
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
// POST REQUEST
// ========================================

export async function onRequestPost(context) {

  try {

    const {
      request,
      env
    } = context;


    // Make sure database binding exists
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


    // Read JSON body
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


    // Get form values
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
    // Saudi mobile number
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
    // CHECK IF EMAIL ALREADY EXISTS
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

    const {
      salt,
      hash
    } =
      await hashPassword(
        password
      );


    // Store salt + hash together
    const storedPassword =
      `pbkdf2$210000$${salt}$${hash}`;


    // ========================================
    // CREATE USER
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


    return jsonResponse(
      {
        success: true,

        message:
          "Account created successfully.",

        user: {
          id:
            result.meta.last_row_id,

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


    return jsonResponse(
      {
        success: false,
        message:
          "Something went wrong while creating your account."
      },
      500
    );

  }

}


// ========================================
// BLOCK OTHER METHODS
// ========================================

export async function onRequest(context) {

  if (
    context.request.method === "POST"
  ) {

    return onRequestPost(context);

  }


  return jsonResponse(
    {
      success: false,
      message:
        "Method not allowed."
    },
    405
  );

}