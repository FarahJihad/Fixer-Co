export async function onRequestGet(context) {
  try {
    const { env, params } = context;
    const technicianId = params.id;

    const technician = await env.DB.prepare(`
      SELECT
        technicians.*,
        technicians.starting_price AS price,
        services.name AS service_name
      FROM technicians
      JOIN services
        ON technicians.service_id = services.id
      WHERE technicians.id = ?
    `)
      .bind(technicianId)
      .first();

    if (!technician) {
      return Response.json(
        { error: "Fixer not found" },
        { status: 404 }
      );
    }

    return Response.json(technician);

  } catch (error) {
    console.error("Profile API error:", error);

    return Response.json(
      { error: "Could not load fixer profile" },
      { status: 500 }
    );
  }
}