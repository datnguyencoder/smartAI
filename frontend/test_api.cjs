const fs = require('fs');

async function testItems() {
  console.log("Starting test...");
  try {
    const res = await fetch("http://localhost:8080/api/v1/items");
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Is items an Array?", Array.isArray(json.data));
    console.log("Keys in data:", Object.keys(json.data || {}));
  } catch (e) {
    console.error("Error", e);
  }
}

testItems();
