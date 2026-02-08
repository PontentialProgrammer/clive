// import 'dotenv/config';

const MODEL = "gemini-2.5-flash"; 
// try {
//     process.loadEnvFile(); // Defaults to ".env" in the current directory
// } catch (err) {
//     console.error("Failed to load .env file:", err);
// }

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const API_KEY = GEMINI_API_KEY



export const generateFullAuditReport = async (mapBase64, paperBase64s, radius) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const systemPrompt = `
    You are a Senior Environmental Consultant and Hydrologist. Use the provided scientific papers for all mathematical derivations.
    
    LATEX & FORMATTING RULES:
    1. Use LaTeX for ALL mathematical formulas. 
    2. Wrap inline math (e.g., variables) in single dollar signs: $I_a$.
    3. Standalone equations MUST be on their own line wrapped in double dollar signs:
       $$Q = \\frac{(P - I_a)^2}{(P - I_a + S)}$$
    4. Ensure proper spacing between paragraphs and use Markdown headers (###) for sections.
    5. Use Markdown tables for cost comparisons and NBS strategies.

    REQUIRED OUTPUT STRUCTURE:
    Your response MUST contain two distinct sections wrapped in these exact tags:
    1. <json_summary>: A flat JSON object for dashboard metrics.
    2. <markdown_report>: A professional, fully-featured report for PDF export.
`;

const userPrompt = `
    Analyze this ${radius}m radius satellite image using the SCS-CN (Run-off) and ISM (Carbon) papers provided in the context.
    
    ### TASK 1: <json_summary>
    Provide a valid JSON object:
    {
      "carbon_tons": number,
      "flood_risk": "Low/Moderate/High/Severe",
      "cn_value": number,
      "primary_nbs": "string",
      "estimated_total_cost": number
    }

    ### TASK 2: <markdown_report>
    Generate a comprehensive research report. Format as follows:
    - **Header**: Site Audit Report (${radius}m Radius).
    - **Methodology**: Cite the papers for the SCS-CN and ISM models used. 
    - **Equations**: Display the primary formulas used for the calculations on new lines.
    - **Interventions**: List specific locations for NBS based on the terrain.
    - **Comparison Table**: Provide three alternative NBS strategies with 2026 cost estimates, including "Maintenance Cost" and "Carbon Offset Potential" columns.
    - **Proper Numbering**: Use a logical 1.0, 1.1, 2.0 numbering system for sections.
`;
  const payload = {
    contents: [{
      parts: [
        { text: systemPrompt },
        { text: userPrompt },
        { inlineData: { mimeType: "image/jpeg", data: mapBase64 } },
        ...paperBase64s.map(base64 => ({
          inlineData: { mimeType: "application/pdf", data: base64 }
        }))
      ]
    }],
    generationConfig: {
      temperature: 0.1, // Set low for data consistency
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`Gemini API Error: ${data.error.message}`);
  }

  if (!data.candidates || data.candidates.length === 0) {
    console.error("Full API Response:", data);
    throw new Error("Gemini returned no results. Check your console for safety/filter blocks.");
  }
  const rawText = data.candidates[0].content.parts[0].text;
  console.log("RAW AI TEXT:", rawText);
  // SURGICAL PARSING: Extracting the two parts
  const jsonMatch = rawText.match(/<json_summary>([\s\S]*?)<\/json_summary>/);
  const markdownMatch = rawText.match(/<markdown_report>([\s\S]*?)<\/markdown_report>/);


  if (!jsonMatch) {
    // If the AI forgot the tags, try to parse the whole text as a backup
    console.warn("AI forgot <json_summary> tags. Attempting to fix...");
  }
  return {
    summary: jsonMatch ? JSON.parse(jsonMatch[1].trim()) : null,
    report: markdownMatch ? markdownMatch[1].trim() : "Report generation failed."
  };
};