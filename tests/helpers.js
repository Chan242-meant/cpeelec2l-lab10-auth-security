const jwt = require("jsonwebtoken");

function signTestToken(id, role) {
  return jwt.sign({ role }, process.env.JWT_SECRET, {
    subject: String(id),
    expiresIn: "15m",
    algorithm: "HS256",
  });
}

// Returns get/post/put/delete helpers that always send the given token
function authedApi(request, app, token) {
  const set = (t) => t.set("Authorization", `Bearer ${token}`);
  return {
    get: (url) => set(request(app).get(url)),
    post: (url) => set(request(app).post(url)),
    put: (url) => set(request(app).put(url)),
    delete: (url) => set(request(app).delete(url)),
  };
}

module.exports = { signTestToken, authedApi };