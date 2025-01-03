# Use an official Node runtime as the parent image
FROM node:18-alpine as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_PROJECT_ID
ARG VITE_STORAGE_BUCKET
ARG VITE_MESSAGING_SENDER_ID
ARG VITE_APP_ID
ARG VITE_MEASUREMENT_ID
ARG VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN
ARG VITE_AIRTABLE_BASE_ID
ENV VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
ENV VITE_FIREBASE_AUTH_DOMAIN=${VITE_FIREBASE_AUTH_DOMAIN}
ENV VITE_PROJECT_ID=${VITE_PROJECT_ID}
ENV VITE_STORAGE_BUCKET=${VITE_STORAGE_BUCKET}
ENV VITE_MESSAGING_SENDER_ID=${VITE_MESSAGING_SENDER_ID}
ENV VITE_APP_ID=${VITE_APP_ID}
ENV VITE_MEASUREMENT_ID=${VITE_MEASUREMENT_ID}
ENV VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN=${VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN}
ENV VITE_AIRTABLE_BASE_ID=${VITE_AIRTABLE_BASE_ID}

# Build the app
RUN npm run build

# Use Nginx to serve the static files
FROM nginx:alpine

# Copy the build output to replace the default nginx contents.
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# EXPOSE port 80
EXPOSE 8080/tcp

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]