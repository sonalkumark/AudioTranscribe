const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const { IamTokenManager } = require('ibm-watson/auth');

const serviceUrl = '<service-url>';

const tokenManager = new IamTokenManager({
  apikey: '<api-key>',
});
app.use(cors());
app.use(express.static(path.join(__dirname, 'dist/AngularAudioTranscribePOC/')));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, './dist/AngularAudioTranscribePOC/' ,'index.html')));
// Get credentials using your credentials
app.get('/api/v1/credentials', async (req, res, next) => {
  try {
    const accessToken = await tokenManager.getToken();
    res.json({
      accessToken,
      serviceUrl,
    });
  } catch (err) {
    next(err);
  }
});
app.listen(4300, () => {
    console.log(`listening at port: 4300`);
});