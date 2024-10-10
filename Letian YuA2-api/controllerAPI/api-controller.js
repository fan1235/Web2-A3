const express = require('express');
const router = express.Router();
const dbcon = require("../crowdfunding_db");
const connection = dbcon.getconnection();

connection.connect(err => {
    if (err) {
        console.error("Error connecting to database: " + err);
        return;
    }
    console.log("Database connected successfully.");
});

// Define and obtain channels for all active fundraisers
router.get("/active", (req, res) => {
    connection.query(
        `SELECT FUNDRAISER.*, CATEGORY.NAME AS CATEGORY_NAME 
         FROM FUNDRAISER 
         JOIN CATEGORY ON FUNDRAISER.CATEGORY_ID = CATEGORY.CATEGORY_ID 
         WHERE FUNDRAISER.ACTIVE = TRUE;`,
        (err, records) => {
            if (err) {
                console.error("Error while retrieving the data: " + err);
                res.status(500).send("Error retrieving active fundraisers.");
            } else {
                res.send(records);
            }
        }
    );
});

// Define route to get all categories
router.get("/categories", (req, res) => {
    connection.query("SELECT * FROM CATEGORY", (err, records) => {
        if (err) {
            console.error("Error while retrieving the categories: " + err);
            res.status(500).send("Error retrieving categories.");
        } else {
            res.send(records);
        }
    });
});

// Search fundraisers
router.get("/search", (req, res) => {
    const { organizer, city, category } = req.query;

    let query = `
        SELECT FUNDRAISER.*, CATEGORY.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER 
        JOIN CATEGORY ON FUNDRAISER.CATEGORY_ID = CATEGORY.CATEGORY_ID 
        WHERE FUNDRAISER.ACTIVE = TRUE
    `;

    if (organizer) {
        query += ` AND FUNDRAISER.ORGANIZER LIKE ${connection.escape('%' + organizer + '%')}`;
    }

    if (city) {
        query += ` AND FUNDRAISER.CITY = ${connection.escape(city)}`;
    }

    if (category) {
        query += ` AND CATEGORY.CATEGORY_ID = ${connection.escape(category)}`;
    }

    connection.query(query, (err, records) => {
        if (err) {
            console.error("Error while retrieving the data: " + err);
            res.status(500).send("Error retrieving fundraisers.");
        } else {
            res.send(records);
        }
    });
});

// Get fundraiser details by ID
router.get("/:id", (req, res) => {
    const fundraiserID = req.params.id;

    const query = `
        SELECT FUNDRAISER.*, CATEGORY.NAME AS CATEGORY_NAME 
        FROM FUNDRAISER 
        JOIN CATEGORY ON FUNDRAISER.CATEGORY_ID = CATEGORY.CATEGORY_ID 
        WHERE FUNDRAISER.FUNDRAISER_ID = ${connection.escape(fundraiserID)}
    `;

    connection.query(query, (err, records) => {
        if (err) {
            console.error("Error while retrieving the data: " + err);
            res.status(500).send("Error retrieving fundraiser details.");
        } else {
            if (records.length === 0) {
                res.status(404).send("Fundraiser not found.");
            } else {
                res.send(records);
            }
        }
    });
});



router.get('/fundraiser/:id', (req, res) => {
    const fundraiserId = req.params.id;
    const query = `
    SELECT f.*, c.NAME as category_name, d.DONATION_ID, d.AMOUNT, d.GIVER, d.DATE
    FROM FUNDRAISER f
    JOIN CATEGORY c ON f.CATEGORY_ID = c.CATEGORY_ID
    LEFT JOIN DONATION d ON f.FUNDRAISER_ID = d.FUNDRAISER_ID
    WHERE f.FUNDRAISER_ID = ?
`;
    connection.query(query, [fundraiserId], (err, records) => {
        if (err) {

            console.error("Error while retrieving the data");
        }

        res.json(records);
    });
});


router.post("/donation", (req, res) => {
    console.log(req.body);

    const { DATE, AMOUNT, GIVER, FUNDRAISER_ID } = req.body;

    const query = `
        INSERT INTO donation (DATE, AMOUNT, GIVER, FUNDRAISER_ID) 
        VALUES (?, ?, ?, ?)
    `;

    connection.query(query, [DATE, AMOUNT, GIVER, FUNDRAISER_ID], (err, result) => {
        if (err) {
            console.error("Error while inserting the data: " + err);
            res.status(500).json({ error: "Error inserting data." });
        } else {
            res.json({ insert: "success" });
        }
    });
});


// Insert a new fundraiser
router.post("/fundraiser", (req, res) => {
    const { organizer, caption, target_funding, current_funding, city, active, category_id } = req.body;

    const query = `
        INSERT INTO FUNDRAISER (ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID) 
        VALUES (${connection.escape(organizer)}, ${connection.escape(caption)}, ${connection.escape(target_funding)}, ${connection.escape(current_funding)}, ${connection.escape(city)}, ${connection.escape(active)}, ${connection.escape(category_id)});
    `;

    connection.query(query, (err, result) => {
        if (err) {
            console.error("Error while inserting fundraiser: " + err);
            res.status(500).send("Error inserting fundraiser.");
        } else {
            res.status(201).send("Fundraiser added successfully.");
        }
    });
});


router.put("/fundraiser/:id", (req, res) => {
    const fundraiserID = req.params.id;
    const { organizer, caption, target_funding, current_funding, city, active, category_id } = req.body;

    const query = `
        UPDATE FUNDRAISER SET 
        ORGANIZER = ${connection.escape(organizer)}, 
        CAPTION = ${connection.escape(caption)}, 
        TARGET_FUNDING = ${connection.escape(target_funding)}, 
        CURRENT_FUNDING = ${connection.escape(current_funding)}, 
        CITY = ${connection.escape(city)}, 
        ACTIVE = ${connection.escape(active)}, 
        CATEGORY_ID = ${connection.escape(category_id)}
        WHERE FUNDRAISER_ID = ${connection.escape(fundraiserID)};
    `;

    connection.query(query, (err, result) => {
        if (err) {
            console.error("Error while updating fundraiser: " + err);
            res.status(500).send("Error updating fundraiser.");
        } else {
            res.send("Fundraiser updated successfully.");
        }
    });
});

// Delete a fundraiser
router.delete("/fundraiser/:id", (req, res) => {
    const fundraiserID = req.params.id;

    const checkDonationsQuery = `
        SELECT COUNT(*) AS donationCount FROM DONATION WHERE FUNDRAISER_ID = ${connection.escape(fundraiserID)};
    `;

    connection.query(checkDonationsQuery, (err, records) => {
        if (err) {
            console.error("Error while checking donations: " + err);
            res.status(500).send("Error checking donations.");
        } else if (records[0].donationCount > 0) {
            res.status(400).send("Cannot delete fundraiser with existing donations.");
        } else {
            const deleteQuery = `
                DELETE FROM FUNDRAISER WHERE FUNDRAISER_ID = ${connection.escape(fundraiserID)};
            `;

            connection.query(deleteQuery, (err, result) => {
                if (err) {
                    console.error("Error while deleting fundraiser: " + err);
                    res.status(500).send("Error deleting fundraiser.");
                } else {
                    res.send("Fundraiser deleted successfully.");
                }
            });
        }
    });
});

module.exports = router;



