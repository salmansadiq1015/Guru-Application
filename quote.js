const Pool = require("pg").Pool;
const fs = require("fs");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "quote",
  password: "busybee",
  port: 5432,
});

// --------Create Quote-------->

const createQuote = async (req, res) => {
  try {
    const { name, description } = req.fields;
    const { photo } = req.files;

    // Validation
    if (!name || !description || !photo) {
      return res.status(401).json({
        success: false,
        message:
          "Please fill all the fields and ensure the image size is less than 1MB",
      });
    }

    const photoData = fs.readFileSync(photo.path);

    // Check Image Size
    const countQuery = "SELECT COUNT(*) FROM quotes";
    const countResult = await pool.query(countQuery);
    const quoteCount = countResult.rows[0].count;

    if (quoteCount >= 10) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum limit of quotes (10) reached. Cannot add more quotes.",
      });
    }

    // Insert the data into the PostgreSQL database
    const query =
      "INSERT INTO quotes (name, description, photo) VALUES ($1, $2, $3) RETURNING *";
    const values = [name, description, photoData];

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      message: "Quote inserted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while creating quote",
      error: error.message,
    });
  }
};

// <---------Get Quote-------->
const getQuote = async (req, res) => {
  try {
    const query = "SELECT * FROM quotes";
    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      message: "All Quotes",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while getting quote",
      error: error.message,
    });
  }
};

// --------------Delete Quote----------->
const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const query = "DELETE FROM quotes WHERE id = $1";
    const result = await pool.query(query, [id]);

    res.status(200).json({
      success: true,
      message: "History deleted successfully!",
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error while getting history",
      error: error.message,
    });
  }
};

// Get Image Controller
const guruImageController = async (req, res) => {
  try {
    const { id } = req.params;

    // Query the database to get the image data
    const query = "SELECT photo FROM quotes WHERE id = $1";
    const result = await pool.query(query, [id]);

    if (result.rows.length === 1) {
      const { photo } = result.rows[0];

      // Check if photo data exists
      if (photo) {
        res.set("Content-type", "image/jpeg");
        return res.status(200).send(photo);
      }
    }

    res.status(404).send("Image not found");
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while getting image!",
      error: error.message,
    });
  }
};

module.exports = { createQuote, getQuote, guruImageController, deleteQuote };
