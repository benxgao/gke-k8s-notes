# Get started in local dev

```sh
# https://levelup.gitconnected.com/getting-started-with-minikube-as-your-local-kubernetes-cluster-cfebf87abc39

brew install minikube
brew install hyperkit
minikube start --vm-driver=hyperkit
kubectl get nodes
kubectl version --output=yaml
minikube status

# Kubernetes control plane is running at https://192.168.64.2:8443
# CoreDNS is running at https://192.168.64.2:8443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
kubectl cluster-info
```
