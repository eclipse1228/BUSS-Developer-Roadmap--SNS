const express = require('express');
const path = require('path');
const router = express.Router();

// roadmap route
router.get('/roadmap', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/roadmap.html'));
  });
module.exports = router;
