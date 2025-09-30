import React, { useState } from "react";
import axios from "axios";
import "./App.css";

// IMPORTANT: Replace with your Cloud Function URL!
const API_ENDPOINT =
  "https://us-central1-gke-251001.cloudfunctions.net/calculatorApi/calculate";

function App() {
  const [expression, setExpression] = useState("2+2");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCalculate = async () => {
    if (!expression) return;
    setError("");
    setResult(null);
    try {
      const response = await axios.post(API_ENDPOINT, { expression });
      setResult(response.data.result);
    } catch (err) {
      setError("Error calculating. Please check the expression.");
      console.error(err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GKE Full-Stack Calculator</h1>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="e.g., (5 + 3) * 2"
        />
        <button onClick={handleCalculate}>Calculate</button>
        {result !== null && <h2>Result: {result}</h2>}
        {error && <p className="error">{error}</p>}
      </header>
    </div>
  );
}

export default App;
