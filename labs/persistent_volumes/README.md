# Node.js App with PostgreSQL on Kubernetes

This guide demonstrates how to deploy a Node.js application and a PostgreSQL database on Kubernetes, and connect them using Kubernetes resources such as Persistent Volumes, Secrets, and Services.

## Project Structure

- `nodejs-replicaset.yml`: Deploys the Node.js app as a ReplicaSet.
- `nodejs-service.yml`: Exposes the Node.js app via a Kubernetes Service.
- `postgres-statefulset.yml`: Deploys PostgreSQL as a StatefulSet for stable storage.
- `postgres-service.yml`: Exposes PostgreSQL via a Kubernetes Service.
- `postgres-pvc.yml`: Defines a PersistentVolumeClaim for PostgreSQL data.
- `db-credentials-secret.yml`: Stores database credentials securely as a Kubernetes Secret.
- `src/`: Node.js application source code and Dockerfile.

## Steps to Deploy

1. **Create Secrets for Database Credentials**

   ```sh
   kubectl apply -f db-credentials-secret.yml
   ```

2. **Create Persistent Volume Claim for PostgreSQL**

   ```sh
   kubectl apply -f postgres-pvc.yml
   ```

3. **Deploy PostgreSQL Database**

   ```sh
   kubectl apply -f postgres-statefulset.yml
   kubectl apply -f postgres-service.yml
   ```

4. **Deploy Node.js Application**

   ```sh
   kubectl apply -f nodejs-replicaset.yml
   kubectl apply -f nodejs-service.yml
   ```

## How It Works

- The Node.js app connects to PostgreSQL using the service name (`postgres-service`) and credentials from the Kubernetes Secret.
- PostgreSQL data is persisted using a PersistentVolumeClaim.
- Both services are discoverable within the cluster via their respective Kubernetes Services.

## Accessing the App

- Forward the Node.js service port to your local machine:

  ```sh
  kubectl port-forward svc/nodejs-service 3000:3000
  ```

- Access the app at `http://localhost:3000`.

## Cleanup

To remove all resources:

```sh
kubectl delete -f .
```
