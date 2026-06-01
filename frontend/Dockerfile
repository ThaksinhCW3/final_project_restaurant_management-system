FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=optional

COPY . .

# Expose Vite's default dev server port
EXPOSE 5173

# Run Vite and force it to expose the network host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
