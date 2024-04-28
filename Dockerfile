# Use the official Golang image as the base image
FROM golang:latest AS builder

# Set the working directory inside the container
WORKDIR /skymeet

# Copy the Go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code into the container
COPY . .

# Build the Go application
RUN go build -o ./bin/app ./cmd/main.go

# Expose the port the application listens on
EXPOSE 8080

# Command to run the application
CMD ["/skymeet/bin/app", "serve"]
