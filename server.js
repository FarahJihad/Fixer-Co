const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   DATABASE CONNECTION
========================= */

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "fixer_co"
});

db.connect((err) => {
  if (err) {
    console.log(
      "Database connection failed:",
      err
    );
  } else {
    console.log(
      "Connected to MySQL database"
    );
  }
});


/* =========================
   SERVICES
========================= */

// Get all services
app.get("/api/services", (req, res) => {

  const sql =
    "SELECT * FROM services";

  db.query(sql, (err, results) => {

    if (err) {

      console.log(err);

      return res
        .status(500)
        .json({
          error:
            "Failed to get services"
        });

    }

    res.json(results);

  });

});


/* =========================
   TECHNICIANS
========================= */

/*
  Get technicians.

  Optional query parameters:

  service=1
  lat=21.5433
  lng=39.1728
  sort=recommended
  sort=nearest
  sort=rating
  sort=price
*/

app.get("/api/technicians", (req, res) => {

  const {
    service,
    lat,
    lng,
    sort
  } = req.query;

  const latitude =
    parseFloat(lat);

  const longitude =
    parseFloat(lng);

  const hasLocation =
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);


  let sql;

  const values = [];


  /*
    If the customer shared their location,
    calculate the distance using the
    Haversine formula.
  */

  if (hasLocation) {

    sql = `
      SELECT
        technicians.*,
        services.name AS service_name,

        (
          6371 * ACOS(
            LEAST(
              1,
              GREATEST(
                -1,
                COS(RADIANS(?))
                * COS(
                    RADIANS(
                      technicians.latitude
                    )
                  )
                * COS(
                    RADIANS(
                      technicians.longitude
                    )
                    - RADIANS(?)
                  )
                +
                SIN(RADIANS(?))
                * SIN(
                    RADIANS(
                      technicians.latitude
                    )
                  )
              )
            )
          )
        ) AS distance

      FROM technicians

      JOIN services
        ON technicians.service_id =
           services.id
    `;

    values.push(
      latitude,
      longitude,
      latitude
    );

  } else {

    sql = `
      SELECT
        technicians.*,
        services.name AS service_name,
        NULL AS distance

      FROM technicians

      JOIN services
        ON technicians.service_id =
           services.id
    `;

  }


  /* =========================
     FILTER BY SERVICE
  ========================= */

  if (service) {

    sql += `
      WHERE technicians.service_id = ?
    `;

    values.push(
      Number(service)
    );

  }


  /* =========================
     SORTING
  ========================= */

  if (
    sort === "nearest" &&
    hasLocation
  ) {

    sql += `
      ORDER BY
        distance IS NULL,
        distance ASC
    `;

  }

  else if (sort === "rating") {

    sql += `
      ORDER BY
        technicians.rating DESC
    `;

  }

  else if (sort === "price") {

    sql += `
      ORDER BY
        technicians.price ASC
    `;

  }

  else if (
    sort === "recommended" &&
    hasLocation
  ) {

    /*
      Recommended priority:

      1. Available Fixers first
      2. Higher ratings
      3. Shorter distance
    */

    sql += `
      ORDER BY
        technicians.available DESC,
        technicians.rating DESC,
        distance IS NULL,
        distance ASC
    `;

  }

  else {

    /*
      Default sorting when location
      is not available.
    */

    sql += `
      ORDER BY
        technicians.available DESC,
        technicians.rating DESC
    `;

  }


  db.query(
    sql,
    values,
    (err, results) => {

      if (err) {

        console.log(
          "Technicians error:",
          err
        );

        return res
          .status(500)
          .json({
            error:
              "Failed to get technicians"
          });

      }


      /*
        Convert distance to a clean
        number such as 2.4 km.
      */

      const technicians =
        results.map(
          (technician) => ({

            ...technician,

            distance:
              technician.distance !== null
                ? Number(
                    technician.distance
                  ).toFixed(1)
                : null

          })
        );


      res.json(
        technicians
      );

    }
  );

});


/* =========================
   ONE TECHNICIAN
========================= */

// Get one technician by ID
app.get(
  "/api/technicians/:id",
  (req, res) => {

    const technicianId =
      req.params.id;

    const sql = `
      SELECT
        technicians.*,
        services.name
          AS service_name

      FROM technicians

      JOIN services
        ON technicians.service_id =
           services.id

      WHERE technicians.id = ?
    `;


    db.query(
      sql,
      [technicianId],
      (err, results) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json({
              error:
                "Failed to get technician"
            });

        }


        if (
          results.length === 0
        ) {

          return res
            .status(404)
            .json({
              error:
                "Technician not found"
            });

        }


        res.json(
          results[0]
        );

      }
    );

  }
);


/* =========================
   SERVICE REQUESTS
========================= */

// Create a new service request
app.post(
  "/api/requests",
  (req, res) => {

    const {
      customer_name,
      phone,
      problem,
      service_id,
      technician_id
    } = req.body;


    if (
      !customer_name ||
      !phone ||
      !problem ||
      !service_id
    ) {

      return res
        .status(400)
        .json({
          error:
            "Please fill in all required fields"
        });

    }


    const sql = `
      INSERT INTO service_requests
      (
        customer_name,
        phone,
        problem,
        service_id,
        technician_id
      )

      VALUES (?, ?, ?, ?, ?)
    `;


    const values = [

      customer_name,

      phone,

      problem,

      Number(service_id),

      technician_id
        ? Number(technician_id)
        : null

    ];


    db.query(
      sql,
      values,
      (err, result) => {

        if (err) {

          console.log(err);

          return res
            .status(500)
            .json({
              error:
                "Failed to create service request"
            });

        }


        res
          .status(201)
          .json({

            message:
              "Service request created successfully",

            request_id:
              result.insertId

          });

      }
    );

  }
);


/* =========================
   CONTACT MESSAGES
========================= */

app.post(
  "/api/contact",
  (req, res) => {

    const {
      name,
      email,
      subject,
      message
    } = req.body;


    if (
      !name ||
      !email ||
      !message
    ) {

      return res
        .status(400)
        .json({
          error:
            "Name, email and message are required."
        });

    }


    const sql = `
      INSERT INTO contact_messages
      (
        name,
        email,
        subject,
        message
      )

      VALUES (?, ?, ?, ?)
    `;


    db.query(
      sql,
      [
        name,
        email,
        subject || null,
        message
      ],
      (error, result) => {

        if (error) {

          console.error(
            "Contact message error:",
            error
          );

          return res
            .status(500)
            .json({
              error:
                "Database error"
            });

        }


        res
          .status(201)
          .json({

            message:
              "Message sent successfully",

            message_id:
              result.insertId

          });

      }
    );

  }
);


/* =========================
   FIXER APPLICATIONS
========================= */

app.post(
  "/api/fixer-applications",
  (req, res) => {

    const {
      name,
      phone,
      email,
      service_id,
      location,
      experience,
      price,
      available,
      bio,
      policy_accepted
    } = req.body;


    if (
      !name ||
      !phone ||
      !email ||
      !service_id ||
      !location ||
      experience === undefined ||
      !price ||
      !policy_accepted
    ) {

      return res
        .status(400)
        .json({
          error:
            "Please complete all required fields."
        });

    }


    const sql = `
      INSERT INTO fixer_applications
      (
        name,
        phone,
        email,
        service_id,
        location,
        experience,
        price,
        available,
        bio,
        policy_accepted
      )

      VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
      sql,
      [
        name,
        phone,
        email,

        Number(service_id),

        location,

        Number(experience),

        Number(price),

        available
          ? 1
          : 0,

        bio || null,

        policy_accepted
          ? 1
          : 0
      ],
      (error, result) => {

        if (error) {

          console.error(
            "Fixer application error:",
            error
          );

          return res
            .status(500)
            .json({
              error:
                "Database error"
            });

        }


        res
          .status(201)
          .json({

            message:
              "Application submitted successfully",

            application_id:
              result.insertId,

            status:
              "pending"

          });

      }
    );

  }
);


/* =========================
   START SERVER
========================= */

app.listen(
  3000,
  () => {

    console.log(
      "Server running on http://localhost:3000"
    );

  }
);