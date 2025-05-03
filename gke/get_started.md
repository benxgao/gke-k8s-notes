# GKE - Get started

## Create a simple cluster on GKE

```sh
gcloud container clusters get-credentials exp-gke --zone us-central1-a --project [project_id]
gcloud container clusters create exp-gke \
    --zone=us-central1-a \
    --num-nodes=1 \
    --machine-type=e2-micro \
    --disk-size=10 \
    --disk-type=pd-standard \
    --network=default \
    --subnetwork=default \
    --enable-ip-alias \
    --release-channel=stable \
    --enable-autorepair \
    --enable-autoupgrade \
    --no-enable-basic-auth \
    --no-issue-client-certificate \
    --preemptible

# External IP address can be generated
kubectl expose deployment/kubernetes-bootstramp --type=LoadBalancer --name=kubernetes-bootstramp

kubectl get services # external_ip would be printed out

curl external_ip:8080 # Use the above external IP to access to the service
```
