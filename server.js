const express = require('express');
const app = express();
const PORT = 3000;

app.get('/video', (req, res) => {
  res.send('Video streaming route works! id=' + req.query.id);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
