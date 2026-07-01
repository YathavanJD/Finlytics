FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install --production

COPY backend/ .

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]