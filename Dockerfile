FROM node:20.5.1

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install npm version 10.2.5
RUN npm install -g npm@10.2.5

# Install application dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install PM2 globally
RUN npm install -g pm2

# Expose the port
EXPOSE 3000

# Start the app with PM2
CMD ["pm2-runtime", "app.js", "--watch"]

# Perform health check
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:3000 || exit 1

