FROM node:22-alpine

WORKDIR /app

# Copy package files first to leverage Docker's cache
COPY package*.json ./
RUN npm install

# Copy the rest of your backend code
COPY . .

# Expose the Express server port
EXPOSE 5000

# Run the app
CMD ["node", "index.js"]