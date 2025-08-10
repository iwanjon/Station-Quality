const express = require('express');
const app = express();

app.get("/api", (req, res) => {
    res.json({ "users": ["userOne", "userTwo", "userThree"] });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server started on port ${PORT}`);
});
