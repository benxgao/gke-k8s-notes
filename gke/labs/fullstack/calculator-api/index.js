const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- API Endpoint ---
app.post("/calculate", async (req, res) => {
  const { expression } = req.body;

  if (!expression) {
    return res.status(400).send({ error: "Expression is required." });
  }

  try {
    // DANGER: eval() is unsafe for production. Used here for simplicity.
    const result = eval(expression);

    // Prepare data for Spanner
    const record = {
      CalculationId: uuidv4(),
      Expression: expression,
      Result: result,
    };

    console.log(`Saved calculation: ${JSON.stringify(record, null, 2)}`);
    res.status(200).send({ result });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send({
      error: `Could not evaluate expression or save data. ${err.message}`,
    });
  }
});

// Export the express app as a single HTTP function
exports.calculatorApi = app;
