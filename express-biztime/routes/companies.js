const express = require("express");
const router = new express.Router();
const slugify = require("slugify");
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
});

router.get("/:code", async function (req, res, next) {
    try {
        const results = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1",
            [req.params.code]
        );

        const invRes = await db.query(
            "SELECT * FROM invoices WHERE comp_code = $1",
            [req.params.code]
        );

        if (results.rows.length === 0) {
            let notFoundError = new Error(
                `No company with code '${req.params.code}`
            );
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ company: results.rows[0], invoices: invRes.rows });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        const { name, description } = req.body;
        const code = slugify(name, { lower: true });
        const result = await db.query(
            `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
            [code, name, description]
        );

        return res.status(201).json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.patch("/:code", async function (req, res, next) {
    try {
        const result = await db.query(
            `UPDATE companies 
            SET name = $1, description = $2
            WHERE code = $3
            RETURNING code, name, description`,
            [req.body.name, req.body.description, req.params.code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(
                `There is no company with code of '${req.params.code}`,
                404
            );
        }

        return res.json({ company: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:code", async function (req, res, next) {
    try {
        const result = await db.query(
            "DELETE FROM companies WHERE code = $1 RETURNING code",
            [req.params.code]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(
                `There is no company with code of '${req.params.code}`,
                404
            );
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
