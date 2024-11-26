# Developer Documentation 

## Development

To set up the development environment, follow these steps:

1. Use Docker Compose to build and run the application:
    ```sh
    docker-compose -f docker-compose-build.yml up --build
    ```


3. Use the compiled command to tag and push. make sure to update the version
    ```sh
    ./dockerBuildPush.sh 
    ```

2. Build the Docker image with a specific tag:
    ```sh
    docker build -t yaledoc/epcis_event_hash_generator:0.1 .
    ```

3. Tag the Docker image as the latest version:
    ```sh
    docker tag yaledoc/epcis_event_hash_generator:0.1 yaledoc/epcis_event_hash_generator:latest
    ```

4. Push the Docker image to Docker Hub:
    ```sh
    docker push yaledoc/epcis_event_hash_generator:0.1
    docker push yaledoc/epcis_event_hash_generator:latest
    ```

## Running the Application

To run the application, simply use Docker Compose:

```sh
docker-compose up