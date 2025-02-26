#  Use a Node.js image to build the React app
FROM node:18-alpine AS build

# Set the working directory
WORKDIR /app

#  Copy only package files first (Optimizes Docker caching)
COPY package.json package-lock.json ./

#  Install dependencies
RUN npm install --frozen-lockfile

#  Copy the rest of the app
COPY . .

#  Build the React app (Vite)
RUN npm run build

#  Use Nginx to serve the built static files
FROM nginx:alpine

#  Copy built files from Node.js build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to serve the React app
EXPOSE 80

#  Start Nginx server
CMD ["nginx", "-g", "daemon off;"]