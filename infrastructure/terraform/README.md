# Terraform Infrastructure

This directory contains Terraform configurations for deploying the Phaser Platformer game to AWS.

## Prerequisites

- Terraform >= 1.0
- AWS CLI configured with appropriate credentials
- kubectl installed
- eksctl (optional, for easier cluster management)

## Quick Start

1. **Initialize Terraform:**

   ```bash
   terraform init
   ```

2. **Create terraform.tfvars:**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

3. **Plan and Apply:**
   ```bash
   terraform plan
   terraform apply
   ```

## Infrastructure Components

- **VPC**: Private and public subnets across 3 AZs
- **EKS**: Kubernetes cluster with managed node groups
- **RDS**: PostgreSQL database for persistence
- **ElastiCache**: Redis for caching
- **ECR**: Container registries for server and client images
- **ALB**: Application Load Balancer for ingress
- **Route53**: DNS management (if domain provided)

## Resources Created

| Component         | Purpose                  |
| ----------------- | ------------------------ |
| VPC               | Networking isolation     |
| EKS Cluster       | Kubernetes orchestration |
| ECR Repositories  | Container image storage  |
| RDS PostgreSQL    | Game data persistence    |
| ElastiCache Redis | Session caching          |
| ALB               | Traffic distribution     |

## Configuration

### Required Variables

- `db_password`: Master password for RDS

### Optional Variables

- `domain_name`: Custom domain for the application
- `node_instance_types`: EC2 instance types for EKS
- `environment`: deployment environment

## Deployment

### 1. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push server
docker build -t phaser-platformer-server:latest -f infrastructure/Dockerfile.server .
docker tag phaser-platformer-server:latest <ecr-server-url>:latest
docker push <ecr-server-url>:latest

# Build and push client
docker build -t phaser-platformer-client:latest -f infrastructure/Dockerfile.client .
docker tag phaser-platformer-client:latest <ecr-client-url>:latest
docker push <ecr-client-url>:latest
```

### 2. Configure kubectl

```bash
aws eks --region us-east-1 update-kubeconfig --name phaser-platformer-development
```

### 3. Deploy to Kubernetes

```bash
kubectl apply -k infrastructure/kubernetes/
```

## Cost Estimation

Estimated monthly costs for development environment:

- EKS Cluster: ~$73
- EC2 (2x t3.medium): ~$60
- RDS (db.t3.micro): ~$15
- ElastiCache (cache.t3.micro): ~$13
- ALB: ~$20
- Data Transfer: ~$10

**Total: ~$190/month**

## Security

- Private subnets for database and cache
- Security groups restrict traffic flow
- SSL/TLS termination at ALB
- Encrypted storage for RDS and EBS
- Secrets managed via AWS Secrets Manager (recommended)

## Monitoring

The infrastructure is configured with:

- CloudWatch for EKS cluster metrics
- RDS Enhanced Monitoring
- ElastiCache monitoring

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

⚠️ **Warning**: This will delete all data. Make sure to backup any important data first.
