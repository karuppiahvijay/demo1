# Use official Node.js image to build the app
FROM node:16 AS build

# Set working directory inside container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code to the container
COPY . .

# Build the application
RUN npm run build

# Use a lightweight web server to serve the built files
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for serving the Vue app
EXPOSE 80
