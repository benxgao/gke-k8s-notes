# Kubernetes and Docker on node.js and postgres

## Get started

```sh
cd src
docker build -t nodejs-app:latest .
```

### 1. Test in container

```sh
kubectl port-forward service/postgres-service 5432:5432

# treat host.docker.internal as a bridge between localdev localhost and a contianer
docker run -d \
  -p 3000:3000 \
  -e PGHOST=host.docker.internal \
  -e PGUSER=myuser \
  -e PGPASSWORD=mypassword \
  -e PGDATABASE=mydb \
  --name my-app \
  nodejs-app:latest

# visit http://localhost:3000/test

docker logs my-app
docker rm -f my-app
```

### 2. Test in kubernetes

```sh
# Kubernetes does not automatically reload pods for local image changes with the same tag. Delete the pods to force recreation
kubectl delete pod -l app=nodejs-app

# In src folder
eval $(minikube docker-env)
docker build -t nodejs-app:latest .

kubectl apply -f db-credentials-secret.yml
kubectl delete pods -l app=nodejs-app

kubectl port-forward svc/nodejs-local-service 3000:3000

# visit http://localhost:3000/test

kubectl logs [pod-name]
```

### 3. Test in GKE

```sh
gcloud auth configure-docker

gcloud artifacts repositories create nodejs-app-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for Node.js app"
```

```sh
cd labs/persistent_volumes/src
docker build -t us-central1-docker.pkg.dev/co-workout-next/nodejs-app-repo/nodejs-app:latest .

docker push us-central1-docker.pkg.dev/co-workout-next/nodejs-app-repo/nodejs-app:latest
```
