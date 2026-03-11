import fetch from "node-fetch";

const API_URL = "http://localhost:3000/api";

async function run() {
  console.log("Creating Scanner Account...");
  const scannerRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Scanner Device 1",
      email: "scanner@nammametro.com",
      phone: "9999999991",
      password: "password123",
      role: "scanner",
      adminSecret: "metro-admin-secret-dev" // Need to set this in env
    })
  });
  console.log("Scanner creation:", await scannerRes.json());

  console.log("Creating Admin Account...");
  const adminRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Metro Admin",
      email: "admin@nammametro.com",
      phone: "9999999992",
      password: "password123",
      role: "admin",
      adminSecret: "metro-admin-secret-dev"
    })
  });
  console.log("Admin creation:", await adminRes.json());
}

run().catch(console.error);
