# GKE Ingress & DNS Tutorial

## 1. Introduction

**Ingress** is a Kubernetes resource that manages external access to services in a cluster, typically HTTP/HTTPS.
Ingress provides advanced routing, SSL termination, and virtual hosting, making it preferable over NodePort/LoadBalancer for complex apps.
**DNS** maps human-friendly domain names to the Ingress controller's external IP, enabling easy access.

## 2. Prerequisites

- A running GKE cluster
- `kubectl` configured for your cluster
- Sample apps deployed (e.g., `calculator-api`, `gke-calculator-ui`)

## 3. Deploy an Ingress Controller

- GKE Autopilot/Standard: Enable the GKE Ingress add-on (recommended)
- Or, deploy NGINX Ingress controller:
  ```sh
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
  ```

## 4. Create an Ingress Resource

- Write an `ingress.yaml` to define routing rules:
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
  	name: fullstack-ingress
  	annotations:
  		kubernetes.io/ingress.class: "gce" # or "nginx" if using NGINX
  spec:
  	rules:
  	- host: <your-domain.com>
  		http:
  			paths:
  			- path: /api
  				pathType: Prefix
  				backend:
  					service:
  						name: calculator-api
  						port:
  							number: 80
  			- path: /
  				pathType: Prefix
  				backend:
  					service:
  						name: gke-calculator-ui
  						port:
  							number: 80
  ```
- Replace `<your-domain.com>` with your actual domain.

## 5. Apply the Ingress Resource

```sh
kubectl apply -f ingress.yaml
```

- Wait for the Ingress to get an external IP:

```sh
kubectl get ingress
```

## 6. Configure DNS

To make your application accessible via a custom domain, configure DNS records with your DNS provider (Google Domains, Cloudflare, GoDaddy, etc.).

### Common DNS Record Types

- **A Record**: Maps a domain (e.g., `fullstack.example.com`) directly to an IPv4 address (the Ingress external IP).

  - Use this when your Ingress exposes a static external IP.
  - Example:
    - **Name**: `fullstack.example.com`
    - **Type**: `A`
    - **Value**: `<INGRESS_EXTERNAL_IP>`

- **CNAME Record**: Maps a subdomain (e.g., `www.example.com`) to another domain name (e.g., `fullstack.example.com`).
  - Use this for subdomains or when pointing to a DNS name (not an IP).
  - Example:
    - **Name**: `www.example.com`
    - **Type**: `CNAME`
    - **Value**: `fullstack.example.com`

### Steps to Configure DNS

1. Get the external IP address of your Ingress:
   ```sh
   kubectl get ingress
   ```
2. In your DNS provider's dashboard, add an **A record** for your domain pointing to the Ingress external IP.
3. (Optional) Add a **CNAME record** for subdomains to point to your main domain.
4. Wait for DNS propagation (can take a few minutes to several hours).

#### Example DNS Configuration Table

| Type  | Name                  | Value                 |
| ----- | --------------------- | --------------------- |
| A     | fullstack.example.com | <INGRESS_EXTERNAL_IP> |
| CNAME | www.example.com       | fullstack.example.com |

After DNS is set up, visiting your domain should route traffic to your GKE Ingress.

## 7. Test the Setup

- Visit your domain in a browser.
- Confirm `/api` routes to the backend API, `/` routes to the UI.

## 8. (Optional) Enable HTTPS

- Use cert-manager or Google-managed certificates for TLS.
- Example for Google-managed cert:
  1.  Create a `ManagedCertificate` resource.
  2.  Annotate your Ingress to use the certificate.

## 9. Cleanup

```sh
kubectl delete -f ingress.yaml
```

- Remove DNS records if no longer needed.
