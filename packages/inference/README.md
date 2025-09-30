# @cognomega/inference

Cognomega Inference microservice - Python-based AI inference service providing model serving and inference capabilities.

## Overview

This microservice provides:
- AI model inference endpoints
- Custom model serving
- Embedding generation
- Text processing and analysis

## Technology Stack

- **Language**: Python
- **Framework**: FastAPI (or similar)
- **Container**: Docker
- **Deployment**: Docker Compose / Kubernetes

## Development

### Prerequisites

- Python 3.9+
- Docker Desktop (recommended)
- pip or poetry

### Install Dependencies

```powershell
cd packages/inference
pip install -r requirements.txt
```

### Run Development Server

Using Docker Compose:
```powershell
cd packages/inference
docker-compose up
```

Or run directly:
```powershell
cd packages/inference
python -m app.main
```

### Build Docker Image

```powershell
cd packages/inference
docker build -t cognomega-inference:latest .
```

## Architecture

This microservice is designed to operate independently:

- **Standalone Service**: Runs as a separate Python service
- **Docker-based**: Containerized for consistent deployment
- **HTTP API**: RESTful API for inference requests
- **Scalable**: Can be scaled independently

## API Endpoints

Typical endpoints (adjust based on actual implementation):

- `GET /health` - Health check
- `POST /infer` - Run inference
- `POST /embed` - Generate embeddings
- `GET /models` - List available models

## Project Structure

```
packages/inference/
├── app/
│   ├── __init__.py
│   ├── main.py           # Application entry point
│   ├── models/           # Model definitions
│   ├── routes/           # API routes
│   └── utils/            # Utilities
├── Dockerfile            # Docker image definition
├── docker-compose.yml    # Docker Compose configuration
├── requirements.txt      # Python dependencies
└── README.md            # This file
```

## Integration Points

### API Service
- Called by the main API service for inference tasks
- Provides specialized AI model inference
- Handles compute-intensive operations

### Independent Operation
- Does not depend on other Cognomega packages
- Can be deployed and scaled separately
- Uses HTTP for communication

## Environment Variables

Create a `.env` file or set environment variables:

```env
MODEL_PATH=/path/to/models
INFERENCE_PORT=8080
LOG_LEVEL=INFO
```

## Deployment

### Docker Compose (Local/Development)

```powershell
cd packages/inference
docker-compose up -d
```

### Kubernetes (Production)

Create Kubernetes manifests for deployment:
- Deployment
- Service
- ConfigMap
- Secrets (for API keys)

### Scaling

This service can be scaled horizontally:
```powershell
docker-compose up --scale inference=3
```

Or in Kubernetes:
```powershell
kubectl scale deployment inference --replicas=3
```

## Model Management

### Adding Models

1. Download model files
2. Place in configured model directory
3. Update model registry/configuration
4. Restart service

### Model Updates

Models can be updated independently without affecting other services.

## Monitoring

- Health checks via `/health` endpoint
- Metrics exposed for Prometheus (if configured)
- Logging to stdout for container log collection

## Contributing

When making changes to this microservice:

1. Follow Python best practices (PEP 8)
2. Add type hints where appropriate
3. Update requirements.txt for new dependencies
4. Test with Docker build before committing
5. Update API documentation for endpoint changes

## Notes

- This is a Python-based service, separate from the TypeScript packages
- Uses Docker for consistent deployment
- Designed for independent scaling based on inference load
- Can use GPU if available for faster inference
- May connect to external model repositories
