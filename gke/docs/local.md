# Init local env

```bash
# Set up local credential for local env
gcloud auth application-default login
gcloud config set project <PROJECT_ID>
gcloud auth application-default set-quota-project <PROJECT_ID>

# Swith to other projects
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/certifai-uat-service-account-key.json"

# To fix "This command is authenticated as email which is the active account specified by the [core/account] property"
gcloud auth activate-service-account --key-file=/path/to/keyfile.json
```
