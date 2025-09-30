## 🧪 GKE Full-Stack Lab: Basic Section

In this section, we will build and deploy a simple web application that performs a calculation.

- **Frontend**: A simple JavaScript web app. It will be containerized with Docker and deployed on GKE.
- **Backend API**: A Node.js Cloud Function that receives a calculation request, evaluates it, and stores the result.
- **Storage**: A Cloud Storage bucket to log all calculations in a file.

### Prerequisites

Before you begin, make sure you have the following installed and set up:

- A **GCP account** with billing enabled.
- The **`gcloud` CLI** installed and authenticated (`gcloud auth login`).
- **`kubectl`** installed (`gcloud components install kubectl`).
- **Docker Desktop** installed and running.
- **Node.js** and **npm** installed.

---

### Step 1: Project Setup and API Enablement

First, let's set up your GCP environment.

1.  **Create a GCP Project**: If you don't have one already, create a new project in the [GCP Console](https://console.cloud.google.com/projectcreate). Note your **Project ID**.

2.  **Set Project in gcloud**:

    ```bash
    gcloud config set project gke-251001
    ```

3.  **Enable APIs**: Enable all the services we'll need for this lab.

    ```bash
    gcloud services enable \
        container.googleapis.com \
        cloudbuild.googleapis.com \
        artifactregistry.googleapis.com \
        cloudfunctions.googleapis.com \
        run.googleapis.com \
        storage.googleapis.com
    ```

---

### Step 2: Set Up the Cloud Storage Bucket

Our backend will store results in a file in a Cloud Storage bucket.

1.  **Create a Cloud Storage Bucket** (choose a unique name):

    ```bash
    export BUCKET_NAME="gke-lab-calculations-$(gcloud config get-value project)-$RANDOM"
    gsutil mb -l us-central1 gs://$BUCKET_NAME
    ```

2.  (Optional) **Set permissions** so your Cloud Function can write to the bucket. If using Workload Identity, grant the appropriate role to the service account:

    ```bash
    gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
        --member="serviceAccount:YOUR_FUNCTION_SERVICE_ACCOUNT" \
        --role="roles/storage.objectAdmin"
    ```

---

### Step 3: Create the Backend API (Cloud Function)

We'll use a serverless Cloud Function for our API to keep things simple and scalable.

1.  **Create a project folder** for the function:

    ```bash
    mkdir calculator-api
    cd calculator-api
    ```

2.  **Initialize a Node.js project**:

    ```bash
    npm init -y
    npm install express @google-cloud/storage cors uuid
    ```

3.  **Create `index.js`**: This file contains our API logic.

    ```javascript
    const express = require("express");
    const cors = require("cors");
    const { Storage } = require("@google-cloud/storage");
    const { v4: uuidv4 } = require("uuid");

    // --- Cloud Storage Configuration ---
    const storage = new Storage();
    const bucketName = process.env.BUCKET_NAME; // Set this env var in your function
    const fileName = "calculations.log";

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

        // Prepare log entry
        const logEntry = `${uuidv4()},${expression},${result},${new Date().toISOString()}\n`;

        // Append to file in Cloud Storage
        const file = storage.bucket(bucketName).file(fileName);
        await file.save(logEntry, { resumable: false, append: true });

        console.log(`Saved calculation: ${expression} = ${result}`);
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
    ```

4.  **Deploy the Function**:

    ```bash
    gcloud functions deploy calculatorApi \
        --gen2 \
        --runtime=nodejs20 \
        --trigger-http \
        --entry-point=calculatorApi \
        --region=us-central1 \
        --allow-unauthenticated \
        --set-env-vars=BUCKET_NAME=$BUCKET_NAME
    ```

    After deployment, **copy the trigger URL**. You will need it for the frontend.

---

### Step 4: Create the Frontend Application

Let's create a simple React app. You can use Vue or vanilla JS as well.

1.  **Create a new React app** in a separate directory:

    ```bash
    npx create-react-app gke-calculator-ui
    cd gke-calculator-ui
    npm install axios
    ```

2.  **Modify `src/App.js`**: Replace the content with the code below. **Remember to paste your Cloud Function URL** where indicated.

    ```javascript
    import React, { useState } from "react";
    import axios from "axios";
    import "./App.css";

    // IMPORTANT: Replace with your Cloud Function URL!
    const API_ENDPOINT = "YOUR_CLOUD_FUNCTION_URL/calculate";

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
    ```

3.  **Test it locally** to make sure it works: `npm start`.

---

### Step 5: Containerize the Frontend

Now we'll package the frontend app into a Docker container.

1.  In the `gke-calculator-ui` directory, create a file named `Dockerfile`:

    ```dockerfile
    # Stage 1: Build the React application
    FROM node:20-alpine AS build
    WORKDIR /app
    COPY package*.json ./
    RUN npm install
    COPY . .
    RUN npm run build

    # Stage 2: Serve the static files with Nginx
    FROM nginx:stable-alpine
    COPY --from=build /app/build /usr/share/nginx/html
    # Copy a custom nginx config if needed, otherwise use default
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    ```

    This is a **multi-stage build**. It uses a Node.js image to build our static files, then copies only those files into a tiny `nginx` image to serve them. This keeps our final image small and secure.

---

### Step 6: Push the Container to Artifact Registry

We need a place to store our container image so GKE can access it.

1.  **Create a Docker repository** in Artifact Registry:

    ```bash
    gcloud artifacts repositories create gke-lab-repo \
        --repository-format=docker \
        --location=us-central1 \
        --description="GKE Lab Docker repository"
    ```

2.  **Configure Docker to authenticate**:

    ```bash
    gcloud auth configure-docker us-central1-docker.pkg.dev
    ```

3.  **Build, Tag, and Push the image**: (Replace `gke-251001`)

    ```bash
    # Build the image
    docker build -t calculator-ui .

    # Tag the image for Artifact Registry
    docker tag calculator-ui us-central1-docker.pkg.dev/gke-251001/gke-lab-repo/calculator-ui:latest

    # Push the image
    docker push us-central1-docker.pkg.dev/gke-251001/gke-lab-repo/calculator-ui:latest
    ```

---

### Step 7: Create and Deploy to a GKE Cluster

It's time for the main event\! Let's deploy our container to GKE.

1.  **Create a GKE Autopilot Cluster**: Autopilot is a great hands-off mode where GKE manages the nodes and scaling for you.

    ```bash
    gcloud container clusters create-auto gke-lab-cluster \
        --region=us-central1
    ```

    _This can take 5-10 minutes._ ☕

2.  **Get Cluster Credentials**: This configures `kubectl` to talk to your new cluster.

    ```bash
    gcloud container clusters get-credentials gke-lab-cluster --region=us-central1
    ```

3.  **Create Kubernetes Manifests**: In your `gke-calculator-ui` folder, create a new `kubernetes` sub-directory. Inside it, create a file named `deployment.yaml`. This file tells Kubernetes how to run your container.

    ```yaml
    # kubernetes/deployment.yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: calculator-ui-deployment
    spec:
      replicas: 2 # Run 2 instances of our app for high availability
      selector:
        matchLabels:
          app: calculator-ui
      template:
        metadata:
          labels:
            app: calculator-ui
        spec:
          containers:
            - name: calculator-ui-container
              # IMPORTANT: Use the image you pushed to Artifact Registry
              image: us-central1-docker.pkg.dev/gke-251001/gke-lab-repo/calculator-ui:latest
              resources:
                requests:
                  cpu: "50m" # Minimum Autopilot CPU request
                  memory: "128Mi" # Minimum Autopilot Memory request
              ports:
                - containerPort: 80

    ---
    apiVersion: v1
    kind: Service
    metadata:
      name: calculator-ui-service
    spec:
      type: LoadBalancer # Exposes the service to the internet
      selector:
        app: calculator-ui
      ports:
        - protocol: TCP
          port: 80 # The port the service is available on
          targetPort: 80 # The port on the container to forward traffic to
    ```

    This file defines two things:

    - A **Deployment**: Manages the lifecycle of your app's pods (running containers).
    - A **Service**: Creates a stable network endpoint (a Load Balancer with a public IP) to access your app.

4.  **Apply the Manifests**:

    ```bash
    kubectl apply -f kubernetes/deployment.yaml
    ```

---

### Step 8: Verify and Test

1.  **Check the Deployment Status**:

    ```bash
    kubectl get deployments
    ```

    You should see `calculator-ui-deployment` with 2/2 replicas available.

2.  **Get the Service's External IP**:

    ```bash
    kubectl get service calculator-ui-service
    ```

    It might take a minute or two for the `EXTERNAL-IP` to change from `<pending>` to an actual IP address.

3.  **Access the App**: Once you have the IP, open it in your web browser: `http://EXTERNAL_IP`. You should see your calculator app\!

4.  **Test It Out!** Perform a calculation. Then, check your Cloud Storage bucket in the GCP console to see the new entry in `calculations.log`. Congratulations, you have a full-stack app running on GKE!

### Cleanup

To avoid ongoing charges, destroy the resources you created:

```bash
# Delete GKE cluster
gcloud container clusters delete gke-lab-cluster --region=us-central1

# Delete Artifact Registry repo
gcloud artifacts repositories delete gke-lab-repo --location=us-central1

# Delete Cloud Function
gcloud functions delete calculatorApi --gen2 --region=us-central1

# Delete Cloud Storage bucket
gsutil rm -r gs://$BUCKET_NAME
```

---

You've now completed the basic section. You've successfully containerized a JavaScript frontend, deployed it to a managed Kubernetes cluster, and connected it to a serverless backend and a secure Cloud Storage log.

Let me know when you're ready to move on to the **Advanced Section**! We can explore topics like:

- Ingress and DNS for custom domains
- Secrets management
- Workload Identity for secure communication between GKE and other GCP services
- Horizontal Pod Autoscaling
