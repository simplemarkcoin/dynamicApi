import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import axios from "axios";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = admin.firestore();

async function triggerIntegrations(collectionId: string, trigger: 'onCreate' | 'onUpdate', data: any) {
  try {
    const configsSnap = await db.collection('apiConfigs')
      .where('collectionId', '==', collectionId)
      .where('trigger', '==', trigger)
      .get();

    for (const doc of configsSnap.docs) {
      const config = doc.data();
      try {
        const response = await axios({
          method: config.method,
          url: config.url,
          headers: config.headers || {},
          data: data
        });

        await db.collection('apiLogs').add({
          apiConfigId: doc.id,
          status: response.status,
          request: { method: config.method, url: config.url, data },
          response: response.data,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (err: any) {
        await db.collection('apiLogs').add({
          apiConfigId: doc.id,
          status: err.response?.status || 500,
          request: { method: config.method, url: config.url, data },
          response: err.response?.data || err.message,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error("Integration trigger failed", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Key Middleware
  const checkApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: "API key required" });
    
    const keySnap = await db.collection('apiKeys').where('key', '==', apiKey).limit(1).get();
    if (keySnap.empty) return res.status(403).json({ error: "Invalid API key" });
    
    next();
  };

  // API Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dynamic CRUD API Generator
  app.get("/api/v1/:collectionSlug", checkApiKey, async (req, res) => {
    try {
      const { collectionSlug } = req.params;
      const colSnap = await db.collection('collections').where('slug', '==', collectionSlug).limit(1).get();
      
      if (colSnap.empty) return res.status(404).json({ error: "Collection not found" });
      const colId = colSnap.docs[0].id;

      const recordsSnap = await db.collection('records').where('collectionId', '==', colId).get();
      const records = recordsSnap.docs.map(d => ({ id: d.id, ...d.data().data }));
      
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/v1/:collectionSlug", checkApiKey, async (req, res) => {
    try {
      const { collectionSlug } = req.params;
      const colSnap = await db.collection('collections').where('slug', '==', collectionSlug).limit(1).get();
      
      if (colSnap.empty) return res.status(404).json({ error: "Collection not found" });
      const colId = colSnap.docs[0].id;

      const newRecord = {
        collectionId: colId,
        data: req.body,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('records').add(newRecord);
      await triggerIntegrations(colId, 'onCreate', req.body);

      res.status(201).json({ id: docRef.id, ...req.body });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/v1/:collectionSlug/:id", checkApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      const doc = await db.collection('records').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Record not found" });
      res.json({ id: doc.id, ...doc.data()?.data });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/v1/:collectionSlug/:id", checkApiKey, async (req, res) => {
    try {
      const { id, collectionSlug } = req.params;
      const colSnap = await db.collection('collections').where('slug', '==', collectionSlug).limit(1).get();
      if (colSnap.empty) return res.status(404).json({ error: "Collection not found" });
      const colId = colSnap.docs[0].id;

      await db.collection('records').doc(id).update({
        data: req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      await triggerIntegrations(colId, 'onUpdate', req.body);
      res.json({ id, ...req.body });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/v1/:collectionSlug/:id", checkApiKey, async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('records').doc(id).delete();
      res.json({ message: "Deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
