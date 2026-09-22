function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";

  for (const cookie of cookieHeader.split(";")) {
    const [key, ...valueParts] = cookie.trim().split("=");

    if (key === name) {
      return valueParts.join("=");
    }
  }

  return null;
}

async function getCurrentUser(request, env) {
  const sessionToken = getCookie(request, "fixer_session");

  if (!sessionToken) {
    return null;
  }

  const row = await env.DB
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
        ON users.id = sessions.user_id

      WHERE sessions.id = ?

      LIMIT 1
    `)
    .bind(sessionToken)
    .first();

  if (!row) {
    return null;
  }

  const expiresAt = new Date(row.expires_at);

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
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    phone: row.phone,
  };
}

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeStatus(value) {
  const status =
    cleanText(value).toLowerCase();

  if (status === "pending") {
    return "requested";
  }

  return status || "requested";
}

function safeParseTags(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter(
          (tag) =>
            typeof tag === "string"
        )
      : [];
  } catch {
    return [];
  }
}

function classifyGroup(items) {
  if (!items.length) {
    return "current";
  }

  const statuses = items.map(
    (item) =>
      normalizeStatus(item.status)
  );

  if (
    statuses.every(
      (status) =>
        status === "cancelled"
    )
  ) {
    return "cancelled";
  }

  if (
    statuses.every(
      (status) =>
        status === "completed"
    )
  ) {
    return "completed";
  }

  return "current";
}

function canCancelGroup(items) {
  return (
    items.length > 0 &&
    items.every(
      (item) =>
        normalizeStatus(item.status) ===
        "requested"
    )
  );
}

const ALLOWED_CANCEL_REASONS =
  new Set([
    "plans_changed",
    "problem_resolved",
    "found_another_fixer",
    "timing_issue",
    "selected_by_mistake",
    "other",
  ]);

const ALLOWED_REVIEW_TAGS =
  new Set([
    "professional",
    "on_time",
    "great_communication",
    "problem_solved",
    "fair_price",
    "clean_work",

    "arrived_late",
    "problem_not_solved",
    "poor_communication",
    "price_issue",

    "other",
  ]);


/* =========================================================
   GET /api/my-requests
   ========================================================= */

export async function onRequestGet(context) {
  try {
    const {
      request,
      env,
    } = context;

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

    const user =
      await getCurrentUser(
        request,
        env
      );

    if (!user) {
      return jsonResponse(
        {
          success: false,
          authenticated: false,
          error:
            "You must log in to view your requests.",
        },
        401
      );
    }

    const result =
      await env.DB
        .prepare(`
          SELECT
            g.id AS request_group_id,
            g.reference_code,
            g.customer_name,
            g.phone,
            g.created_at
              AS request_created_at,

            i.id
              AS request_item_id,
            i.slot_number,
            i.service_id,
            i.technician_id,
            i.problem,
            i.status,
            i.created_at
              AS item_created_at,

            s.name
              AS service_name,

            t.name
              AS technician_name,

            t.rating
              AS technician_rating,

            t.location
              AS technician_location,

            t.starting_price
              AS technician_price,

            t.available
              AS technician_available,

            r.rating
              AS review_rating,

            r.tags
              AS review_tags,

            r.comment
              AS review_comment,

            r.created_at
              AS review_created_at,

            c.reason_code
              AS cancellation_reason,

            c.note
              AS cancellation_note,

            c.created_at
              AS cancelled_at

          FROM service_request_groups g

          JOIN service_request_items i
            ON i.request_group_id =
               g.id

          JOIN services s
            ON s.id =
               i.service_id

          LEFT JOIN technicians t
            ON t.id =
               i.technician_id

          LEFT JOIN service_request_reviews r
            ON r.request_item_id =
               i.id

          LEFT JOIN service_request_cancellations c
            ON c.request_group_id =
               g.id

          WHERE g.user_id = ?

          ORDER BY
            g.created_at DESC,
            i.slot_number ASC
        `)
        .bind(user.id)
        .all();

    const rows =
      Array.isArray(
        result.results
      )
        ? result.results
        : [];

    const requestMap =
      new Map();

    for (const row of rows) {
      const groupId =
        String(
          row.request_group_id
        );

      if (
        !requestMap.has(
          groupId
        )
      ) {
        requestMap.set(
          groupId,
          {
            id:
              groupId,

            reference_code:
              row.reference_code,

            customer_name:
              row.customer_name,

            phone:
              row.phone,

            created_at:
              row.request_created_at,

            cancellation:
              row.cancelled_at
                ? {
                    reason_code:
                      row.cancellation_reason,

                    note:
                      row.cancellation_note,

                    created_at:
                      row.cancelled_at,
                  }
                : null,

            items: [],
          }
        );
      }

      const group =
        requestMap.get(
          groupId
        );

      const status =
        normalizeStatus(
          row.status
        );

      const review =
        row.review_rating !== null &&
        row.review_rating !== undefined
          ? {
              rating:
                Number(
                  row.review_rating
                ),

              tags:
                safeParseTags(
                  row.review_tags
                ),

              comment:
                row.review_comment ||
                "",

              created_at:
                row.review_created_at,
            }
          : null;

      group.items.push({
        id:
          String(
            row.request_item_id
          ),

        slot_number:
          Number(
            row.slot_number
          ),

        service_id:
          Number(
            row.service_id
          ),

        service_name:
          row.service_name,

        technician_id:
          row.technician_id !== null &&
          row.technician_id !== undefined
            ? Number(
                row.technician_id
              )
            : null,

        technician_name:
          row.technician_name ||
          null,

        technician_rating:
          row.technician_rating !== null &&
          row.technician_rating !== undefined
            ? Number(
                row.technician_rating
              )
            : null,

        technician_location:
          row.technician_location ||
          null,

        technician_price:
          row.technician_price !== null &&
          row.technician_price !== undefined
            ? Number(
                row.technician_price
              )
            : null,

        technician_available:
          row.technician_available !== null &&
          row.technician_available !== undefined
            ? Number(
                row.technician_available
              )
            : null,

        problem:
          row.problem,

        status,

        created_at:
          row.item_created_at,

        review,

        can_review:
          (
            status === "completed" &&
            row.technician_id !== null &&
            row.technician_id !== undefined &&
            !review
          ),
      });
    }

    const requests =
      Array.from(
        requestMap.values()
      ).map(
        (group) => {
          const category =
            classifyGroup(
              group.items
            );

          return {
            ...group,

            category,

            can_cancel:
              category === "current" &&
              canCancelGroup(
                group.items
              ),
          };
        }
      );

    const counts = {
      current:
        requests.filter(
          (requestItem) =>
            requestItem.category ===
            "current"
        ).length,

      completed:
        requests.filter(
          (requestItem) =>
            requestItem.category ===
            "completed"
        ).length,

      cancelled:
        requests.filter(
          (requestItem) =>
            requestItem.category ===
            "cancelled"
        ).length,
    };

    return jsonResponse({
      success: true,
      requests,
      counts,
    });
  } catch (error) {
    console.error(
      "My Requests GET error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        error:
          "Could not load your requests.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500
    );
  }
}


/* =========================================================
   POST /api/my-requests
   ========================================================= */

export async function onRequestPost(context) {
  try {
    const {
      request,
      env,
    } = context;

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

    const user =
      await getCurrentUser(
        request,
        env
      );

    if (!user) {
      return jsonResponse(
        {
          success: false,
          authenticated: false,
          error:
            "You must log in to continue.",
        },
        401
      );
    }

    let body;

    try {
      body =
        await request.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        400
      );
    }

    const action =
      cleanText(
        body.action
      );

    if (
      action ===
      "cancel_request"
    ) {
      return await cancelRequest({
        env,
        user,
        body,
      });
    }

    if (
      action ===
      "submit_review"
    ) {
      return await submitReview({
        env,
        user,
        body,
      });
    }

    return jsonResponse(
      {
        success: false,
        error:
          "Unsupported request action.",
      },
      400
    );
  } catch (error) {
    console.error(
      "My Requests POST error:",
      error
    );

    return jsonResponse(
      {
        success: false,

        error:
          "Something went wrong. Please try again.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      500
    );
  }
}


/* =========================================================
   CANCEL REQUEST
   ========================================================= */

async function cancelRequest({
  env,
  user,
  body,
}) {
  const requestGroupId =
    cleanText(
      body.request_group_id
    );

  const reasonCode =
    cleanText(
      body.reason_code
    );

  const note =
    cleanText(
      body.note
    );

  if (!requestGroupId) {
    return jsonResponse(
      {
        success: false,
        error:
          "Request ID is required.",
      },
      400
    );
  }

  if (
    !ALLOWED_CANCEL_REASONS.has(
      reasonCode
    )
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Please choose a valid cancellation reason.",
      },
      400
    );
  }

  if (
    note.length >
    1000
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Cancellation note must be 1000 characters or fewer.",
      },
      400
    );
  }

  const group =
    await env.DB
      .prepare(`
        SELECT
          id,
          user_id

        FROM service_request_groups

        WHERE id = ?
          AND user_id = ?

        LIMIT 1
      `)
      .bind(
        requestGroupId,
        user.id
      )
      .first();

  if (!group) {
    return jsonResponse(
      {
        success: false,
        error:
          "Request not found.",
      },
      404
    );
  }

  const existingCancellation =
    await env.DB
      .prepare(`
        SELECT id

        FROM service_request_cancellations

        WHERE request_group_id = ?

        LIMIT 1
      `)
      .bind(
        requestGroupId
      )
      .first();

  if (
    existingCancellation
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "This request has already been cancelled.",
      },
      409
    );
  }

  const itemResult =
    await env.DB
      .prepare(`
        SELECT
          id,
          status

        FROM service_request_items

        WHERE request_group_id = ?
          AND user_id = ?
      `)
      .bind(
        requestGroupId,
        user.id
      )
      .all();

  const items =
    Array.isArray(
      itemResult.results
    )
      ? itemResult.results
      : [];

  if (
    items.length === 0
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "No services were found for this request.",
      },
      404
    );
  }

  const cancellable =
    items.every(
      (item) =>
        normalizeStatus(
          item.status
        ) === "requested"
    );

  if (!cancellable) {
    return jsonResponse(
      {
        success: false,

        error:
          "This request can no longer be cancelled because one of its services has already progressed.",
      },
      409
    );
  }

  const cancellationId =
    crypto.randomUUID();

  await env.DB.batch([
    env.DB
      .prepare(`
        INSERT INTO service_request_cancellations
        (
          id,
          request_group_id,
          user_id,
          reason_code,
          note
        )

        VALUES (?, ?, ?, ?, ?)
      `)
      .bind(
        cancellationId,
        requestGroupId,
        user.id,
        reasonCode,
        note || null
      ),

    env.DB
      .prepare(`
        UPDATE service_request_items

        SET status = 'cancelled'

        WHERE request_group_id = ?
          AND user_id = ?
          AND status = 'requested'
      `)
      .bind(
        requestGroupId,
        user.id
      ),
  ]);

  return jsonResponse({
    success: true,

    message:
      "Your request has been cancelled.",

    request_group_id:
      requestGroupId,

    status:
      "cancelled",
  });
}


/* =========================================================
   SUBMIT REVIEW
   ========================================================= */

async function submitReview({
  env,
  user,
  body,
}) {
  const requestItemId =
    cleanText(
      body.request_item_id
    );

  const rating =
    Number(
      body.rating
    );

  const rawTags =
    Array.isArray(
      body.tags
    )
      ? body.tags
      : [];

  const comment =
    cleanText(
      body.comment
    );

  if (!requestItemId) {
    return jsonResponse(
      {
        success: false,
        error:
          "Service request item is required.",
      },
      400
    );
  }

  if (
    !Number.isInteger(
      rating
    ) ||
    rating < 1 ||
    rating > 5
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Rating must be between 1 and 5 stars.",
      },
      400
    );
  }

  if (
    comment.length >
    1000
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Review comment must be 1000 characters or fewer.",
      },
      400
    );
  }

  const tags = [
    ...new Set(
      rawTags
        .map(
          (tag) =>
            cleanText(tag)
        )
        .filter(Boolean)
    ),
  ];

  if (
    tags.length >
    6
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Please choose no more than 6 review tags.",
      },
      400
    );
  }

  for (const tag of tags) {
    if (
      !ALLOWED_REVIEW_TAGS.has(
        tag
      )
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "One or more review tags are invalid.",
        },
        400
      );
    }
  }

  const item =
    await env.DB
      .prepare(`
        SELECT
          i.id,
          i.status,
          i.technician_id,
          i.user_id,

          g.id
            AS request_group_id

        FROM service_request_items i

        JOIN service_request_groups g
          ON g.id =
             i.request_group_id

        WHERE i.id = ?
          AND i.user_id = ?
          AND g.user_id = ?

        LIMIT 1
      `)
      .bind(
        requestItemId,
        user.id,
        user.id
      )
      .first();

  if (!item) {
    return jsonResponse(
      {
        success: false,
        error:
          "Service request not found.",
      },
      404
    );
  }

  if (
    normalizeStatus(
      item.status
    ) !== "completed"
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "You can rate a Fixer only after the service is completed.",
      },
      409
    );
  }

  if (
    item.technician_id === null ||
    item.technician_id === undefined
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "No Fixer is attached to this service.",
      },
      409
    );
  }

  const existingReview =
    await env.DB
      .prepare(`
        SELECT id

        FROM service_request_reviews

        WHERE request_item_id = ?

        LIMIT 1
      `)
      .bind(
        requestItemId
      )
      .first();

  if (
    existingReview
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "You have already rated this service.",
      },
      409
    );
  }

  const reviewId =
    crypto.randomUUID();

  await env.DB
    .prepare(`
      INSERT INTO service_request_reviews
      (
        id,
        request_item_id,
        user_id,
        technician_id,
        rating,
        tags,
        comment
      )

      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      reviewId,
      requestItemId,
      user.id,
      Number(
        item.technician_id
      ),
      rating,
      JSON.stringify(
        tags
      ),
      comment || null
    )
    .run();

  return jsonResponse(
    {
      success: true,

      message:
        "Thank you for your feedback!",

      review: {
        id:
          reviewId,

        request_item_id:
          requestItemId,

        rating,

        tags,

        comment,
      },
    },
    201
  );
}