
const fetch = require('node-fetch');

async function testPile() {
    const GEMINI_API_KEY = "AIzaSyA0dLWMqt6CadwjIzkGsIk11g0wUFsvnTA";
    const fullPrompt = "Analyze church growth data. Generate 1 high-impact insight. Output JSON: { \"insights\": [{ \"subject\": \"Media Ministry\", \"summary\": \"Test Insight\", \"detail\": \"This is a test\", \"recommended_action\": \"No action\", \"insight_type\": \"opportunity\", \"urgency\": \"this_week\" }] }";

    console.log("Testing Gemini API...");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Success! Data:", JSON.stringify(data, null, 2));
        } else {
            console.error("Error! Status:", response.status);
            const err = await response.text();
            console.error("Body:", err);
        }
    } catch (err) {
        console.error("Fetch Exception:", err);
    }
}

testPile();
