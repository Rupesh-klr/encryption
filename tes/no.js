// 1. Your Google Apps Script Web App URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxPCW4sh6_U4f3s4NOktYuhWFHwn8Kq-4sLrUGuDVvGcEbY61pG_HV2Irk-B7FtOO7L/exec";

// 2. The Data Payload (Must match what your GAS script expects)
const payload = {
  "id": "unique_id_123",          // UUID to identify this specific change
  "timestamp": 1738612345678,     // exact time (Date.now())
  "author": "Rupesh-MacBook",     // Who made the change
  "device_id": "xyz-browser-fp",  // Device fingerprint (for security)
  "action": "UPDATE",             // UPDATE, CREATE, or DELETE
  "version": 1.2,                 // App version
  "payload": "U2FsdGVkX19...hello" ,    // The ACTUAL encrypted data,
  "changed_versiosnid":""//start empty are any message any one can understand that it because veriosn is start at this point.
};
// {
//   authToken: "rupesh-secure-token-2026", // 🔑 Must match API_SECRET in your GAS code
//   user: "NodeTerminalUser",
//   encryptedData: "U2FsdGVkX19_TEST_DATA_FROM_TERMINALknfkbfjbjlfbljdblfjbfj" // Simulated encrypted string
// };
/*
"ENCRYPTED::" + 
*/
async function sendData() {
  console.log("🚀 Sending data to Google Drive Vault...");
  console.log("Target URL:", WEB_APP_URL);

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      redirect: "follow", // Important: GAS often redirects
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // 'text/plain' prevents CORS preflight issues in some cases
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    console.log("\n✅ SERVER RESPONSE:");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("\n❌ ERROR FAILED:");
    console.error(error.message);
  }
}

sendData();