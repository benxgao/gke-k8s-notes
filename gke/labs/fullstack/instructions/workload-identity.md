# GKE Workload Identity Lab: Secure GKE-to-GCP Communication

## Overview

Workload Identity is the recommended way for GKE workloads to securely access Google Cloud services. It allows Kubernetes service accounts to act as Google service accounts, eliminating the need for long-lived service account keys.

This lab will guide you through the basic steps to:

- Enable Workload Identity on your GKE cluster
- Create and configure Kubernetes and Google service accounts
- Bind them together
- Deploy a simple app that uses Workload Identity to access a GCP service (e.g., Cloud Storage or Cloud Spanner)

---

## Prerequisites

- GKE cluster (Autopilot or Standard)
- `gcloud` and `kubectl` installed and configured
- Owner or Editor permissions on your GCP project

---

## Step 1: Enable Workload Identity on the Cluster

If you created your cluster with Autopilot, Workload Identity is enabled by default. For Standard clusters, enable it with:

```bash
gcloud container clusters update gke-lab-cluster \
    --workload-pool=$(gcloud config get-value project).svc.id.goog \
    --region=us-central1
```

---

## Step 2: Create a Google Service Account (GSA)

```bash
gcloud iam service-accounts create gke-workload-demo \
    --display-name="GKE Workload Demo"
```

Grant the GSA permissions to access a GCP service (e.g., Spanner):

```bash
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:gke-workload-demo@$(gcloud config get-value project).iam.gserviceaccount.com" \
    --role="roles/spanner.databaseUser"
```

---

## Step 3: Create a Kubernetes Service Account (KSA)

```bash
kubectl create serviceaccount ksa-workload-demo
```

---

## Step 4: Bind the KSA to the GSA

Allow the KSA to impersonate the GSA:

```bash
gcloud iam service-accounts add-iam-policy-binding \
    gke-workload-demo@$(gcloud config get-value project).iam.gserviceaccount.com \
    --role roles/iam.workloadIdentityUser \
    --member "serviceAccount:$(gcloud config get-value project).svc.id.goog[default/ksa-workload-demo]"
```

Annotate the KSA with the GSA email:

```bash
kubectl annotate serviceaccount ksa-workload-demo \
    iam.gke.io/gcp-service-account=gke-workload-demo@$(gcloud config get-value project).iam.gserviceaccount.com
```

---

## Step 5: Deploy a Pod Using the KSA

Here is a simple deployment example (e.g., using the Google Cloud SDK image):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: workload-identity-demo
spec:
  serviceAccountName: ksa-workload-demo
  containers:
    - name: gcloud
      image: google/cloud-sdk:slim
      command: ["/bin/sh", "-c"]
      args:
        - gcloud spanner instances list; sleep 3600
```

Apply it:

```bash
kubectl apply -f workload-identity-demo.yaml
```

Check the pod logs to verify access:

```bash
kubectl logs workload-identity-demo
```

---

## Cleanup

```bash
kubectl delete pod workload-identity-demo
kubectl delete serviceaccount ksa-workload-demo
# Optionally delete the GSA
# gcloud iam service-accounts delete gke-workload-demo@$(gcloud config get-value project).iam.gserviceaccount.com
```

---

## Key Concepts

- **No service account keys**: Workload Identity uses short-lived credentials, not static keys.
- **Fine-grained permissions**: Grant only the permissions needed to the GSA.
- **Separation of concerns**: KSA for Kubernetes, GSA for Google Cloud.

You now have a secure, keyless way for GKE workloads to access Google Cloud services!
