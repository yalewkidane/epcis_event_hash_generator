#bi  

#!/bin/bash

# Define the version variable
VERSION=0.2

# Build the Docker image with the specified version
docker build -t yaledoc/epcis_event_hash_generator:$VERSION .
# Tag the Docker image as the latest version
docker tag yaledoc/epcis_event_hash_generator:$VERSION yaledoc/epcis_event_hash_generator:latest

# Push the Docker image to Docker Hub
docker push yaledoc/epcis_event_hash_generator:$VERSION
docker push yaledoc/epcis_event_hash_generator:latest