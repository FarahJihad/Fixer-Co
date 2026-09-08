export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);

    const service = url.searchParams.get("service");
    const lat = url.searchParams.get("lat");
    const lng = url.searchParams.get("lng");
    const sort = url.searchParams.get("sort") || "recommended";

    let query = `
      SELECT
  technicians.*,
  technicians.starting_price AS price,
  services.name AS service_name
      FROM technicians
      JOIN services
        ON technicians.service_id = services.id
    `;

    const conditions = [];
    const params = [];

    if (service) {
      conditions.push("technicians.service_id = ?");
      params.push(service);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    let technicians = await context.env.DB
      .prepare(query)
      .bind(...params)
      .all();

    technicians = technicians.results;

    if (lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);

      technicians = technicians.map((technician) => {
        if (
          technician.latitude === null ||
          technician.longitude === null
        ) {
          return {
            ...technician,
            distance: null
          };
        }

        const distance = calculateDistance(
          userLat,
          userLng,
          Number(technician.latitude),
          Number(technician.longitude)
        );

        return {
          ...technician,
          distance: Number(distance.toFixed(1))
        };
      });
    } else {
      technicians = technicians.map((technician) => ({
        ...technician,
        distance: null
      }));
    }

    if (sort === "nearest") {
      technicians.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;

        return a.distance - b.distance;
      });
    } else if (sort === "rating") {
      technicians.sort(
        (a, b) => Number(b.rating) - Number(a.rating)
      );
    } else if (sort === "price") {
      technicians.sort(
        (a, b) =>
          Number(a.starting_price) -
          Number(b.starting_price)
      );
    } else {
      technicians.sort((a, b) => {
        if (Number(b.available) !== Number(a.available)) {
          return Number(b.available) - Number(a.available);
        }

        if (Number(b.rating) !== Number(a.rating)) {
          return Number(b.rating) - Number(a.rating);
        }

        if (a.distance === null) return 1;
        if (b.distance === null) return -1;

        return a.distance - b.distance;
      });
    }

    return new Response(JSON.stringify(technicians), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Could not load technicians."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}