# Commands

## Set up local

```sh
# create service account
# download credentials.json
export GOOGLE_APPLICATION_CREDENTIALS=/Users/gke-k8s-notes/gke/labs/fullstack/gcp_credencials.json

gcloud auth activate-service-account --key-file=/Users/gke-k8s-notes/gke/labs/fullstack/gcp_credencials.json
```

## GKE first deployment

```sh
docker build -t calculator-ui .
docker tag calculator-ui us-central1-docker.pkg.dev/gke-251001/gke-lab-repo/calculator-ui:v1.0
docker push us-central1-docker.pkg.dev/gke-251001/gke-lab-repo/calculator-ui:v1.0

# grant kubectl local
gcloud container clusters get-credentials gke-lab-cluster --project gke-251001 --region us-central1

kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

```

## GKE rollout/re-deployment

```sh
kubectl set image deployment/calculator-ui-deployment calculator-ui-container=us-central1-docker.pkg.dev/gke-251001/gke-lab-repo/calculator-ui:v1.0

kubectl rollout status deployment/calculator-ui-deployment

# Show the running pods
kubectl get pods

# Check the image being used by the deployment
kubectl get deployment calculator-ui-deployment -o yaml | grep "image:"

```
