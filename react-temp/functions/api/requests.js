const MAX_SERVICES = 2;
const MAX_IMAGES_PER_SERVICE = 3;
const MAX_IMAGE_BYTES = 1_500_000;

const MIN_PROBLEM_LENGTH = 10;
const MAX_PROBLEM_LENGTH = 1000;

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;


// ========================================
// JSON RESPONSE
// ========================================

function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",

        "Cache-Control":
          "no-store"
      }
    }
  );
}


// ========================================
// GET COOKIE
// ========================================

function getCookie(
  request,
  name
) {
  const cookieHeader =
    request.headers.get("Cookie") || "";

  for (
    const cookie of
    cookieHeader.split(";")
  ) {
    const [
      key,
      ...valueParts
    ] = cookie
      .trim()
      .split("=");

    if (key === name) {
      return valueParts.join("=");
    }
  }

  return null;
}


// ========================================
// GET CURRENT USER
// ========================================

async function getCurrentUser(
  request,
  env
) {
  const sessionToken =
    getCookie(
      request,
      "fixer_session"
    );

  if (!sessionToken) {
    return null;
  }

  const user =
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
          ON users.id =
             sessions.user_id

        WHERE sessions.id = ?

        LIMIT 1
      `)
      .bind(sessionToken)
      .first();

  if (!user) {
    return null;
  }

  const expiresAt =
    new Date(
      user.expires_at
    );

  if (
    Number.isNaN(
      expiresAt.getTime()
    ) ||
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

  return user;
}


// ========================================
// HELPERS
// ========================================

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}


function isPositiveInteger(
  value
) {
  return (
    Number.isInteger(value) &&
    value > 0
  );
}


// ========================================
// SERVICE VALIDATION
// ========================================

function normalizeServiceItems(
  rawItems
) {
  if (!Array.isArray(rawItems)) {
    throw new Error(
      "Service details must be an array."
    );
  }

  if (
    rawItems.length < 1 ||
    rawItems.length >
      MAX_SERVICES
  ) {
    throw new Error(
      `You can submit between 1 and ${MAX_SERVICES} services.`
    );
  }

  const seenServices =
    new Set();

  return rawItems.map(
    (
      rawItem,
      index
    ) => {
      const slot =
        Number(
          rawItem?.slot ||
            index + 1
        );

      const serviceId =
        Number(
          rawItem?.service_id
        );

      const technicianId =
        rawItem?.technician_id ===
          null ||
        rawItem?.technician_id ===
          undefined ||
        rawItem?.technician_id ===
          ""
          ? null
          : Number(
              rawItem.technician_id
            );

      const problem =
        cleanText(
          rawItem?.problem
        );

      if (
        !Number.isInteger(slot) ||
        slot < 1 ||
        slot > MAX_SERVICES
      ) {
        throw new Error(
          "Invalid service slot."
        );
      }

      if (
        !isPositiveInteger(
          serviceId
        )
      ) {
        throw new Error(
          `Invalid service for Service ${slot}.`
        );
      }

      if (
        technicianId !== null &&
        !isPositiveInteger(
          technicianId
        )
      ) {
        throw new Error(
          `Invalid fixer for Service ${slot}.`
        );
      }

      if (
        problem.length <
          MIN_PROBLEM_LENGTH ||
        problem.length >
          MAX_PROBLEM_LENGTH
      ) {
        throw new Error(
          `Problem description for Service ${slot} must be between ${MIN_PROBLEM_LENGTH} and ${MAX_PROBLEM_LENGTH} characters.`
        );
      }

      if (
        seenServices.has(
          serviceId
        )
      ) {
        throw new Error(
          "The same service cannot be added twice."
        );
      }

      seenServices.add(
        serviceId
      );

      return {
        slot,
        serviceId,
        technicianId,
        problem
      };
    }
  );
}


// ========================================
// VERIFY SERVICE + FIXER
// ========================================

async function validateServiceAndFixer(
  env,
  item
) {
  const service =
    await env.DB
      .prepare(`
        SELECT id

        FROM services

        WHERE id = ?

        LIMIT 1
      `)
      .bind(
        item.serviceId
      )
      .first();

  if (!service) {
    throw new Error(
      `Service ${item.slot} does not exist.`
    );
  }

  if (
    item.technicianId === null
  ) {
    return;
  }

  const technician =
    await env.DB
      .prepare(`
        SELECT
          id,
          service_id

        FROM technicians

        WHERE id = ?

        LIMIT 1
      `)
      .bind(
        item.technicianId
      )
      .first();

  if (!technician) {
    throw new Error(
      `The selected fixer for Service ${item.slot} does not exist.`
    );
  }

  if (
    Number(
      technician.service_id
    ) !==
    item.serviceId
  ) {
    throw new Error(
      `The selected fixer does not match Service ${item.slot}.`
    );
  }
}


// ========================================
// IMAGES
// ========================================

function filesForSlot(
  formData,
  slot
) {
  return formData
    .getAll(
      `service_${slot}_images`
    )
    .filter(
      (value) =>
        typeof File !==
          "undefined" &&
        value instanceof File
    );
}


async function detectImageType(
  file
) {
  const bytes =
    new Uint8Array(
      await file
        .slice(0, 12)
        .arrayBuffer()
    );

  // JPG
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  // PNG
  const pngSignature = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a
  ];

  if (
    bytes.length >= 8 &&
    pngSignature.every(
      (
        byte,
        index
      ) =>
        bytes[index] ===
        byte
    )
  ) {
    return "image/png";
  }

  // WEBP
  if (
    bytes.length >= 12 &&
    String.fromCharCode(
      ...bytes.slice(0, 4)
    ) === "RIFF" &&
    String.fromCharCode(
      ...bytes.slice(8, 12)
    ) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}


async function validateImages(
  files,
  slot
) {
  if (
    files.length >
    MAX_IMAGES_PER_SERVICE
  ) {
    throw new Error(
      `Service ${slot} can have up to ${MAX_IMAGES_PER_SERVICE} images.`
    );
  }

  const validated = [];

  for (
    const file of files
  ) {
    if (
      file.size <= 0 ||
      file.size >
        MAX_IMAGE_BYTES
    ) {
      throw new Error(
        `Each image for Service ${slot} must be 1.5 MB or smaller.`
      );
    }

    const contentType =
      await detectImageType(
        file
      );

    if (!contentType) {
      throw new Error(
        `Only JPG, PNG, and WebP images are allowed for Service ${slot}.`
      );
    }

    validated.push({
      file,
      contentType
    });
  }

  return validated;
}


// ========================================
// REQUEST REFERENCE
// ========================================

function makeReferenceCode() {
  return (
    "FX-" +
    crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase()
  );
}


function safeOriginalName(
  name
) {
  return cleanText(name)
    .replace(
      /[^\w.\- ]+/g,
      "_"
    )
    .slice(
      0,
      120
    );
}


// ========================================
// POST /api/requests
// ========================================

export async function onRequestPost(
  context
) {
  try {
    const {
      request,
      env
    } = context;


    // DATABASE
    if (!env.DB) {
      return jsonResponse(
        {
          success: false,
          error:
            "Database connection is not configured."
        },
        500
      );
    }


    // AUTH
    const user =
      await getCurrentUser(
        request,
        env
      );

    if (!user) {
      return jsonResponse(
        {
          success: false,
          error:
            "You must log in before sending a service request."
        },
        401
      );
    }


    // MUST BE FORM DATA
    const contentType =
      request.headers.get(
        "Content-Type"
      ) || "";

    if (
      !contentType
        .toLowerCase()
        .startsWith(
          "multipart/form-data"
        )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "This endpoint expects multipart form data."
        },
        415
      );
    }


    // READ FORM
    let formData;

    try {
      formData =
        await request.formData();
    } catch {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid request form data."
        },
        400
      );
    }


    // SERVICES JSON
    let parsedServices;

    try {
      parsedServices =
        JSON.parse(
          String(
            formData.get(
              "services"
            ) || "[]"
          )
        );
    } catch {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid service details."
        },
        400
      );
    }


    let serviceItems;

    try {
      serviceItems =
        normalizeServiceItems(
          parsedServices
        );
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          error:
            error?.message ||
            "Invalid service details."
        },
        400
      );
    }


    // ========================================
    // RATE LIMIT
    // ========================================

    const recentCount =
      await env.DB
        .prepare(`
          SELECT
            COUNT(*) AS count

          FROM service_request_groups

          WHERE user_id = ?

            AND datetime(created_at)
              >= datetime(
                'now',
                '-${RATE_LIMIT_WINDOW_MINUTES} minutes'
              )
        `)
        .bind(
          user.id
        )
        .first();

    if (
      Number(
        recentCount?.count || 0
      ) >=
      RATE_LIMIT_COUNT
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Too many requests were submitted recently. Please wait a few minutes and try again."
        },
        429
      );
    }


    // ========================================
    // VALIDATE SERVICE + FIXER
    // ========================================

    for (
      const item of serviceItems
    ) {
      try {
        await validateServiceAndFixer(
          env,
          item
        );
      } catch (error) {
        return jsonResponse(
          {
            success: false,
            error:
              error?.message ||
              "Invalid service or fixer."
          },
          400
        );
      }
    }


    // ========================================
    // VALIDATE PHOTOS
    // ========================================

    const imagesBySlot = {};

    for (
      const item of serviceItems
    ) {
      try {
        imagesBySlot[
          item.slot
        ] =
          await validateImages(
            filesForSlot(
              formData,
              item.slot
            ),
            item.slot
          );
      } catch (error) {
        return jsonResponse(
          {
            success: false,
            error:
              error?.message ||
              "Invalid image upload."
          },
          400
        );
      }
    }


    // ========================================
    // NAME + PHONE FROM ACCOUNT
    // ========================================

    const accountName =
      cleanText(
        user.name
      ) ||
      cleanText(
        user.username
      );

    if (!accountName) {
      return jsonResponse(
        {
          success: false,
          error:
            "Your account name is missing."
        },
        400
      );
    }


    let phone =
      cleanText(
        user.phone
      );


    // Google account may not have phone yet.
    if (!phone) {
      phone =
        cleanText(
          formData.get(
            "phone"
          )
        );

      if (
        !/^05\d{8}$/.test(
          phone
        )
      ) {
        return jsonResponse(
          {
            success: false,
            error:
              "Please provide a valid Saudi phone number starting with 05."
          },
          400
        );
      }

      await env.DB
        .prepare(`
          UPDATE users

          SET phone = ?

          WHERE id = ?

            AND (
              phone IS NULL
              OR
              TRIM(phone) = ''
            )
        `)
        .bind(
          phone,
          user.id
        )
        .run();
    }

    else if (
      !/^05\d{8}$/.test(
        phone
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "The phone number saved on your account is invalid."
        },
        400
      );
    }


    // ========================================
    // IDS
    // ========================================

    const groupId =
      crypto.randomUUID();

    const referenceCode =
      makeReferenceCode();


    const itemRecords =
      serviceItems.map(
        (item) => ({
          ...item,

          id:
            crypto.randomUUID()
        })
      );


    const imageRecords = [];


    // ========================================
    // CONVERT IMAGES TO D1 BLOBS
    // ========================================

    for (
      const item of itemRecords
    ) {
      const files =
        imagesBySlot[
          item.slot
        ] || [];

      for (
        const validated of files
      ) {
        const imageId =
          crypto.randomUUID();

        const imageData =
          await validated.file
            .arrayBuffer();

        imageRecords.push({
          id:
            imageId,

          requestItemId:
            item.id,

          storageKey:
            `d1/${groupId}/${item.id}/${imageId}`,

          originalName:
            safeOriginalName(
              validated.file.name
            ),

          contentType:
            validated.contentType,

          sizeBytes:
            validated.file.size,

          imageData
        });
      }
    }


    // ========================================
    // DATABASE BATCH
    // ========================================

    const statements = [
      env.DB
        .prepare(`
          INSERT INTO service_request_groups
          (
            id,
            reference_code,
            user_id,
            customer_name,
            phone
          )

          VALUES (?, ?, ?, ?, ?)
        `)
        .bind(
          groupId,
          referenceCode,
          user.id,
          accountName,
          phone
        )
    ];


    // SERVICE ITEMS
    for (
      const item of itemRecords
    ) {
      statements.push(
        env.DB
          .prepare(`
            INSERT INTO service_request_items
            (
              id,
              request_group_id,
              user_id,
              slot_number,
              service_id,
              technician_id,
              problem,
              status
            )

            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              'requested'
            )
          `)
          .bind(
            item.id,
            groupId,
            user.id,
            item.slot,
            item.serviceId,
            item.technicianId,
            item.problem
          )
      );
    }


    // IMAGES
    for (
      const image of imageRecords
    ) {
      statements.push(
        env.DB
          .prepare(`
            INSERT INTO service_request_images
            (
              id,
              request_item_id,
              storage_key,
              original_name,
              content_type,
              size_bytes,
              image_data
            )

            VALUES (
              ?,
              ?,
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `)
          .bind(
            image.id,
            image.requestItemId,
            image.storageKey,
            image.originalName,
            image.contentType,
            image.sizeBytes,
            image.imageData
          )
      );
    }


    await env.DB.batch(
      statements
    );


    // ========================================
    // SUCCESS
    // ========================================

    return jsonResponse(
      {
        success: true,

        message:
          "Service request created successfully.",

        request_id:
          referenceCode,

        reference_code:
          referenceCode,

        request_group_id:
          groupId,

        services:
          itemRecords.map(
            (item) => ({
              id:
                item.id,

              slot:
                item.slot,

              service_id:
                item.serviceId,

              technician_id:
                item.technicianId
            })
          )
      },
      201
    );
  }

  catch (error) {
    console.error(
      "Create request error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        error:
          "Could not create the service request.",

        details:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );
  }
}