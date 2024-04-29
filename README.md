# SkyMeet - WebRTC Video Chat Application
SkyMeet is a video chat application built using WebRTC technology. It features a signaling server implemented in GoLang, enabling real-time video communication between users. The application is designed to be easy to use and deploy, leveraging Docker for containerization.

## Key Features
- Real-time video chat functionality powered by WebRTC
- In-call chat for sending text messages during video calls
- Lightweight GoLang-based websocket signaling server
- Dockerized for easy deployment and scalability

## Prerequisites
- Docker installed on your system.

## Getting Started

Follow these steps to build and run the SkyMeet application:

1. Clone the repository to your local machine:
```bash
git clone https://github.com/iamber12/skymeet
```

2. Navigate to the project directory:
```bash
cd skymeet
```

3. Build the Docker image:
```bash
docker build -t skymeet .
```

4. Run the Docker container:
```bash
docker run -p 8080:8080 skymeet
```


5. Access the application by opening a web browser and navigating to `http://localhost:8080`.

## Usage
- Upon accessing the application, you will be prompted to enter a username.
- After entering a username, you will be redirected to a new room.
- Share the room URL with others using the "Room Link" button to invite them to join the video chat.
- Enjoy seamless real-time video chat with participants in the same room.

## Screeshots
![image](https://github.com/iamber12/skymeet/assets/26606211/327597af-c8d1-4287-828e-2da9d2b4d3d4)

![image](https://github.com/iamber12/skymeet/assets/26606211/e3f660d8-6790-4e1e-bb8a-c49fdc7204a3)


## Configuration
- The default port for the application is `8080`. You can modify the port binding in the Docker run command as needed.
