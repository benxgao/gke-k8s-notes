# Useful commands of minikube

```sh
# Create
gcloud container clusters get-credentials exp-gke --zone us-central1-a --project [project_id] # GKE only

kubectl config current-context # Check kube context
cat ~/.kube/config

minikube delete --all # Delete all context
minikube start
kubectl get nodes
kubectl cluster-info
kubectl run kubernetes-bootcamp --rm -ti \
  --image=docker.io/jocatalin/kubernetes-bootcamp:v1 \
  --port=8080

kubectl create deployment kubernetes-bootcamp \
  --image=docker.io/jocatalin/kubernetes-bootcamp:v1 \
  --port=8080

kubectl get deployments
kubectl describe deployment kubernetes-bootcamp
kubectl describe replicaset
kubectl get pods

# External IP address can be generated
kubectl expose deployment/kubernetes-bootcamp --type=LoadBalancer --name=kubernetes-bootcamp
kubectl get services
kubectl get svc kubernetes-bootcamp
curl external_ip:8080


# Inspect container name
kubectl get deployment kubernetes-bootcamp -o yaml
kubectl get namespace
kubectl get nodes
minikube tunnel # For accessing LB external IP address
```

```sh
# Update
kubectl scale deployments/kubernetes-bootcamp --replicas=1
kubectl set image deployments/kubernetes-bootcamp kubernetes-bootcamp=jocatalin/kubernetes-bootcamp:v2
```

```sh
# Delete
kubectl rollout undo
kubectl deletedeployment nginx-deployment
kubectldelete -f nginx.yml
```

## References

[]（https://www.amazon.com/%E6%AF%8F%E5%A4%A95%E5%88%86%E9%92%9F%E7%8E%A9%E8%BD%ACKubernetes-CloudMan/dp/B07BF3V9CR）
