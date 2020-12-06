#!/bin/bash

gcloud functions delete gitmeet-api-users-dev-auth --region=asia-south1 --project=shark-hacks-297613 --quiet
gcloud functions delete gitmeet-api-users-dev-callback --region=asia-south1 --project=shark-hacks-297613 --quiet
gcloud functions delete gitmeet-api-users-dev-createUser --region=asia-south1 --project=shark-hacks-297613 --quiet
gcloud functions delete gitmeet-api-users-dev-createSchema --region=asia-south1 --project=shark-hacks-297613 --quiet
gcloud functions delete gitmeet-api-users-dev-editUser --region=asia-south1 --project=shark-hacks-297613 --quiet
gcloud functions delete gitmeet-api-users-dev-getUser --region=asia-south1 --project=shark-hacks-297613 --quiet
gcloud functions delete gitmeet-api-users-dev-verifyUser --region=asia-south1 --project=shark-hacks-297613 --quiet