CREATE DATABASE IF NOT EXISTS fixer_co;
USE fixer_co;


/* ========================================
   SERVICES
======================================== */

CREATE TABLE IF NOT EXISTS services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);


/* ========================================
   TECHNICIANS
======================================== */

CREATE TABLE IF NOT EXISTS technicians (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    service_id INT NOT NULL,
    rating DECIMAL(2,1) DEFAULT 0,
    location VARCHAR(100),
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    available BOOLEAN DEFAULT TRUE,
    price DECIMAL(10,2),

    FOREIGN KEY (service_id)
        REFERENCES services(id)
);


/* ========================================
   SERVICE REQUESTS
======================================== */

CREATE TABLE IF NOT EXISTS service_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    problem TEXT NOT NULL,
    service_id INT NOT NULL,
    technician_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (service_id)
        REFERENCES services(id),

    FOREIGN KEY (technician_id)
        REFERENCES technicians(id)
);


/* ========================================
   CONTACT MESSAGES
======================================== */

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(150),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


/* ========================================
   FIXER APPLICATIONS
======================================== */

CREATE TABLE IF NOT EXISTS fixer_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    service_id INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    experience INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    bio TEXT,
    status ENUM(
        'pending',
        'approved',
        'rejected'
    ) DEFAULT 'pending',
    policy_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (service_id)
        REFERENCES services(id)
);


/* ========================================
   DEMO SERVICES
======================================== */

INSERT INTO services (id, name) VALUES
(1, 'AC & Cooling'),
(2, 'Plumbing'),
(3, 'Electrical'),
(4, 'Appliances'),
(5, 'Carpentry & Furniture'),
(6, 'General Maintenance')
ON DUPLICATE KEY UPDATE
name = VALUES(name);


/* ========================================
   DEMO FIXERS
======================================== */

INSERT INTO technicians (
    id,
    name,
    service_id,
    rating,
    location,
    latitude,
    longitude,
    available,
    price
)
VALUES

(
    1,
    'Ahmed Alharbi',
    1,
    4.9,
    'Jeddah - Al Safa',
    21.58450000,
    39.21400000,
    TRUE,
    70
),

(
    2,
    'Mohammed Ali',
    1,
    4.7,
    'Jeddah - Al Rawdah',
    21.56800000,
    39.17400000,
    TRUE,
    65
),

(
    3,
    'Faisal Salem',
    2,
    4.8,
    'Jeddah - Al Zahra',
    21.60500000,
    39.16500000,
    TRUE,
    60
),

(
    4,
    'Khalid Hassan',
    3,
    4.6,
    'Jeddah - Al Rehab',
    21.57600000,
    39.22500000,
    FALSE,
    80
),

(
    5,
    'Omar Saad',
    4,
    4.9,
    'Jeddah - Al Hamra',
    21.52000000,
    39.17000000,
    TRUE,
    75
),

(
    6,
    'Yousef Nasser',
    5,
    4.5,
    'Jeddah - Al Salamah',
    21.59000000,
    39.15500000,
    TRUE,
    90
)

ON DUPLICATE KEY UPDATE

name = VALUES(name),
service_id = VALUES(service_id),
rating = VALUES(rating),
location = VALUES(location),
latitude = VALUES(latitude),
longitude = VALUES(longitude),
available = VALUES(available),
price = VALUES(price);