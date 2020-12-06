#!/bin/bash

gcloud functions deploy gitmeet-api-users-dev-auth --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613
gcloud functions deploy gitmeet-api-users-dev-callback --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613
gcloud functions deploy gitmeet-api-users-dev-createUser --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613
gcloud functions deploy gitmeet-api-users-dev-createSchema --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613
gcloud functions deploy gitmeet-api-users-dev-editUser --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613
gcloud functions deploy gitmeet-api-users-dev-getUser --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613
gcloud functions deploy gitmeet-api-users-dev-verifyUser --region=asia-south1 --allow-unauthenticated --runtime=nodejs12 --trigger-http --project=shark-hacks-297613