# Dynamic Admin Dashboard

A low-code platform to create dynamic data structures, auto-generate CRUD APIs, and integrate with external services.

## Features
- **Dynamic Field Builder**: Create custom collections with text, number, select, boolean, date, and JSON fields.
- **Auto CRUD API**: Automatically generates REST endpoints for every collection created.
- **Integrations**: Trigger external API calls on data creation or updates.
- **API Keys**: Manage access keys for external consumption of your APIs.
- **Logging**: Track all outgoing integration calls.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js (Express), Firebase Admin SDK.
- **Database**: Google Firestore.
- **Auth**: Firebase Authentication (Google Login).

## Local Development

### Prerequisites
- Node.js (v18+)
- A Firebase Project

### Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `firebase-applet-config.json` in the root with your Firebase credentials:
   ```json
   {
     "projectId": "your-project-id",
     "appId": "your-app-id",
     "apiKey": "your-api-key",
     "authDomain": "your-auth-domain",
     "firestoreDatabaseId": "(default)"
   }
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Running with Docker

1. Build the Docker image:
   ```bash
   docker build -t dynamic-admin-dashboard .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env dynamic-admin-dashboard
   ```

## API Usage Example

Once you create a collection with slug `products` and an API key `sk_...`, you can access it via:

### Get all records
```bash
curl -H "x-api-key: sk_your_key" http://localhost:3000/api/v1/products
```

### Create a record
```bash
curl -X POST -H "x-api-key: sk_your_key" -H "Content-Type: application/json" \
     -d '{"name": "New Product", "price": 99.99}' \
     http://localhost:3000/api/v1/products
```
