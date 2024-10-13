const express = require('express');
const router = express.Router();
const dbcon = require("../crowdfunding_db");
const connection = dbcon.getconnection();

//Used to establish a connection to the database
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

//Used to retrieve all categories
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

//Used to search for fundraising events
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

//Obtain fundraising activity details based on ID
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


//Obtain details of fundraising activities and their donation information
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

//Add a new donation
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

//Used to update fundraising event information
router.post("/fundraiser", (req, res) => {
    const { ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID } = req.body;

    const query = `
        INSERT INTO FUNDRAISER (ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID];

    connection.query(query, values, (err, result) => {
        if (err) {
            console.error("Error while retrieve the data" + err);
        } else {
            res.send({ insert: "success" });
        }
    })
})


router.put('/fundraiser/:id', (req, res) => {  //Retrieve the fundraising event ID from the URL parameters
    const fundraiserId = req.params.id;
    const { ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID } = req.body;  //Deconstructing the fields that need to be updated from the request body

    const query = `UPDATE FUNDRAISER SET ORGANIZER = ?, CAPTION = ?, TARGET_FUNDING = ?, CURRENT_FUNDING = ?, CITY = ?, ACTIVE = ?, CATEGORY_ID = ? WHERE FUNDRAISER_ID = ?`;

    connection.query(query, [ORGANIZER, CAPTION, TARGET_FUNDING, CURRENT_FUNDING, CITY, ACTIVE, CATEGORY_ID, fundraiserId], (err, result) => {
        if (err) {
            console.error("Error while retrieve the data" + err); //If an error occurs, output an error message on the console
        } else {
            res.send({ update: "success" });  //If the update is successful, send a successful response
        }
    })
})

//Delete fundraising event
router.delete("/fundraiser/:id", (req, res) => {
    const fundraiserID = req.params.id;

    //Firstly, check if there are any relevant donations
    const checkDonationsQuery = `
        SELECT COUNT(*) AS donationCount FROM DONATION WHERE FUNDRAISER_ID = ${connection.escape(fundraiserID)};
    `;

    connection.query(checkDonationsQuery, (err, records) => {
        if (err) {
            console.error("Error while checking donations: " + err);
            res.status(500).send("Error checking donations.");
        } else if (records[0].donationCount > 0) {
            //If there is a donation, deletion is not allowed
            res.status(400).send("Cannot delete fundraiser with existing donations.");
        } else {
            //If there is no donation, perform a deletion operation
            const deleteQuery = `
                DELETE FROM FUNDRAISER WHERE FUNDRAISER_ID = ${connection.escape(fundraiserID)};
            `;

            connection.query(deleteQuery, (err, result) => {
                if (err) {
                    console.error("Error while deleting fundraiser: " + err);
                    res.status(500).send("Error deleting fundraiser.");
                } else {
                    res.send({delete:"Delete Sucess"});
                }
            });
        }
    });
});

module.exports = router;
