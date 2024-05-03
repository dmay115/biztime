const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

router.get("/", async function (req, res, next) {
    try {
        const results = await db.query(`SELECT * FROM invoices`);
        return res.json({ companies: results.rows });
    } catch (e) {
        return next(e);
    }
});

router.get("/:id", async function (req, res, next) {
    try {
        const results = await db.query(
            "SELECT id, amt, paid, add_date, paid_date FROM invoices WHERE id = $1",
            [req.params.id]
        );
        const companyCode = await db.query(
            "SELECT comp_code FROM invoices WHERE id = $1",
            [req.params.id]
        );
        const compRes = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1",
            [companyCode.rows[0].comp_code]
        );

        if (results.rows.length === 0) {
            let notFoundError = new Error(
                `No invoice with id of '${req.params.code}`
            );
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ invoice: results.rows[0], company: compRes.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async function (req, res, next) {
    try {
        let { amt, paid } = req.body;
        let id = req.params.id;
        let paidDate = null;

        const currResult = await db.query(
            `SELECT paid
               FROM invoices
               WHERE id = $1`,
            [id]
        );

        if (currResult.rows.length === 0) {
            throw new ExpressError(`No such invoice: ${id}`, 404);
        }

        const currPaidDate = currResult.rows[0].paid_date;

        if (!currPaidDate && paid) {
            paidDate = new Date();
        } else if (!paid) {
            paidDate = null;
        } else {
            paidDate = currPaidDate;
        }

        const result = await db.query(
            `UPDATE invoices
               SET amt=$1, paid=$2, paid_date=$3
               WHERE id=$4
               RETURNING id, comp_code, amt, paid, add_date, paid_date`,
            [amt, paid, paidDate, id]
        );

        return res.json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        const result = await db.query(
            "DELETE FROM invoices WHERE code = $1 RETURNING id",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            throw new ExpressError(
                `There is no invoice with code of '${req.params.id}`,
                404
            );
        }
        return res.json({ status: "deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
