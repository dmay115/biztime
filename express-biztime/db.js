const { Client } = require("pg");

let db;

// if (process.env.NODE_ENV === "production") {
//     db = new Client({
//         connectionString: process.env.biztime,
//         ssl: {
//             rejectUnauthorized: false,
//         },
//     });
// } else {
db = new Client({
    user: "derek",
    host: "localhost",
    database: "biztime",
    password: "new_password", // or omit this line altogether
    port: 5432, // or your PostgreSQL port
});
// }

db.connect()
    .then(() => console.log("Connected to PostgreSQL database"))
    .catch((err) =>
        console.error("Error connecting to PostgreSQL database", err)
    );

module.exports = db;
