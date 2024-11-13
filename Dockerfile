# Use the official Node.js LTS image as the base image
FROM node:16

# Set the working directory
WORKDIR /usr/src/app/src

# Copy package.json and package-lock.json from the src directory
COPY src/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code from the src directory
COPY src .

# Copy the .env file to the root of the working directory
#COPY .env /usr/src/app/src/.env

# Expose the port the app runs on
EXPOSE 7085

# Command to run the application
CMD ["node", "index.js"]