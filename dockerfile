# Use a Node.js image as the base
FROM node:23-alpine3.19

# Set the working directory
WORKDIR /app

# Copy the sources of the code into the container
COPY . .

# Set environment variables
ENV NEXT_PUBLIC_VIEW_MODE="false"
ENV VIEW_COMFY_FILE_NAME="view_comfy.json"
ENV COMFYUI_BASE_URL="127.0.0.1" 
ENV COMFYUI_PORT="8188" 
# ENV COMFY_OUTPUT_DIR="/app/output" 

# Install dependencies AND folder output if not exist
RUN npm install && mkdir -p /app/output

# Define volumes for persistent data
# not functionnal, is COMFY_OUTPUT_DIR not implemented in ViewComfy ?
# VOLUME /app/output

# Expose port 3000 for the Next.js application
EXPOSE 3000

# Command to start the application in development mode
CMD ["npm", "run", "dev"]
