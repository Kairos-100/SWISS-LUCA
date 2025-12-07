# Firebase App Hosting - Backend Deployment Guide

## 📋 Overview

This guide explains how to deploy the backend to Firebase App Hosting (which uses Cloud Run under the hood).

## ✅ Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged into Firebase: `firebase login`
3. Backend code ready in `/backend` directory

## 🔧 Configuration

### 1. Dockerfile (✅ Created)

The Dockerfile is located at `/backend/Dockerfile` and is configured for:
- Node.js 20 (LTS)
- Port 8080 (Firebase App Hosting standard)
- Production dependencies only
- Health checks
- Non-root user for security

### 2. Server Configuration (✅ Updated)

The server (`server.js`) is configured to:
- Listen on `0.0.0.0` (required for Cloud Run)
- Use `PORT` environment variable (defaults to 8080)
- Handle errors gracefully
- Support graceful shutdown

### 3. Environment Variables

Set these in Firebase Console → App Hosting → Backend → Environment Variables:

```
PORT=8080
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_your_key_here
FRONTEND_URL=https://your-frontend-url.com
```

## 🚀 Deployment Steps

### Option 1: Deploy via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `t4learningluca`
3. Navigate to **App Hosting**
4. Click on your backend service: `backoffice-backendvla`
5. Go to **Settings** → **Backend Configuration**
6. Verify:
   - **Source Directory**: `backend`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Build Command**: (auto-detected)
   - **Start Command**: `node server.js`
7. Set environment variables (see above)
8. Click **Deploy** or push to your connected repository

### Option 2: Deploy via Firebase CLI

```bash
# From project root
cd backend

# Build and test locally first
docker build -t backend-test .
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e STRIPE_SECRET_KEY=your_key \
  backend-test

# If local test works, deploy via Firebase Console or connect your repo
```

### Option 3: Manual Cloud Run Deployment

```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project t4learningluca

# Build and push image
cd backend
gcloud builds submit --tag gcr.io/t4learningluca/backend

# Deploy to Cloud Run
gcloud run deploy backoffice-backendvla \
  --image gcr.io/t4learningluca/backend \
  --platform managed \
  --region europe-west4 \
  --port 8080 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-env-vars PORT=8080,NODE_ENV=production
```

## 🔍 Troubleshooting

### Issue: Container fails to start

**Symptoms:**
- Error: "The user-provided container failed to start and listen on PORT=8080"

**Solutions:**

1. **Check Cloud Run Logs**
   - Go to Cloud Console → Cloud Run → Your Service → Logs
   - Look for startup errors

2. **Verify PORT is set**
   ```bash
   # In your server.js, ensure:
   const PORT = process.env.PORT || 8080;
   ```

3. **Verify listening on 0.0.0.0**
   ```bash
   # In your server.js, ensure:
   app.listen(PORT, '0.0.0.0', ...)
   ```

4. **Test locally with Docker**
   ```bash
   cd backend
   docker build -t test .
   docker run -p 8080:8080 -e PORT=8080 test
   curl http://localhost:8080/health
   ```

### Issue: Dependencies not found

**Solution:**
- Ensure `package.json` has all dependencies listed in `dependencies` (not `devDependencies`)
- Run `npm ci --only=production` locally to verify

### Issue: Timeout during startup

**Solutions:**
1. Reduce startup time (remove heavy initialization)
2. Increase Cloud Run timeout in Firebase Console
3. Add health check endpoint (✅ already added at `/health`)

## 📊 Health Checks

The backend includes a health check endpoint:

```bash
curl https://your-backend-url/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-12-07T...",
  "stripe": "configured" or "not configured"
}
```

## 🔐 Security Checklist

- ✅ Non-root user in Dockerfile
- ✅ Only production dependencies installed
- ✅ Environment variables used (not hardcoded)
- ✅ CORS configured properly
- ✅ Helmet.js for security headers
- ✅ Error handling for sensitive data

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `STRIPE_SECRET_KEY` | Yes* | - | Stripe secret key |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |
| `HOST` | No | `0.0.0.0` | Server host |

*Required for payment features to work

## 🎯 Quick Test

After deployment, test your backend:

```bash
# Health check
curl https://your-backend-url.run.app/health

# Root endpoint
curl https://your-backend-url.run.app/

# Expected: JSON response with status
```

## 📚 Additional Resources

- [Firebase App Hosting Docs](https://firebase.google.com/docs/app-hosting)
- [Cloud Run Docs](https://cloud.google.com/run/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## ✅ Deployment Checklist

- [ ] Dockerfile created and tested locally
- [ ] Server listens on `0.0.0.0:8080`
- [ ] Environment variables configured in Firebase Console
- [ ] Health check endpoint working (`/health`)
- [ ] CORS configured for frontend URL
- [ ] Stripe keys configured (if using payments)
- [ ] Tested locally with Docker
- [ ] Deployed to Firebase App Hosting
- [ ] Verified health check after deployment
- [ ] Checked Cloud Run logs for errors

---

**Last Updated:** December 2025
**Backend Service:** `backoffice-backendvla`
**Region:** `europe-west4`
