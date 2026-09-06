function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return bufferToHex(hashBuffer);
}

export async function onRequestPost(context) {
  try {
    const { name, email, phone, password } =
      await context.request.json();

    if (!name || !email || !password) {
      return Response.json(
        { error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const existingUser = await context.env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(email)
      .first();

    if (existingUser) {
      return Response.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await context.env.DB.prepare(`
      INSERT INTO users (
        name,
        email,
        phone,
        password
      )
      VALUES (?, ?, ?, ?)
    `)
      .bind(
        name,
        email,
        phone || null,
        hashedPassword
      )
      .run();

    return Response.json(
      {
        message: "Account created successfully.",
        userId: result.meta.last_row_id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register API error:", error);

    return Response.json(
      { error: "Could not create account." },
      { status: 500 }
    );
  }
}