const express = require('express');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const app = express();
app.use(express.json());

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

const bucket = process.env.S3_BUCKET || 'app-uploads';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', bucket });
});

app.post('/upload', async (req, res) => {
  try {
    const key = req.body.key || `test-${Date.now()}.txt`;
    const body = req.body.content || 'Hello from ArgoCD + RustFS lab';

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      })
    );

    const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
    res.json({
      uploaded: key,
      objects: (list.Contents || []).map((item) => item.Key),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));