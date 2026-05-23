// =====================================================
// GROQ CODE NODE - Paste ini ke n8n Code node
// Ganti GROQ_API_KEY dengan key dari console.groq.com
// =====================================================

const GROQ_API_KEY = 'GANTI_API_KEY_GROQ_DISINI';

const text = $input.first().json.text || '';

const response = await $http.request({
  method: 'POST',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  headers: {
    'Authorization': 'Bearer ' + GROQ_API_KEY,
    'Content-Type': 'application/json'
  },
  body: {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: [
          'Kamu adalah AI classifier untuk bisnis jasa desain arsitektur & interior bernama Sudut Ruang.',
          '',
          'Tugasmu: Analisis pesan WhatsApp dari calon klien dan tentukan intent + ekstrak data.',
          '',
          'Kembalikan HANYA JSON valid tanpa penjelasan apapun.',
          '',
          'Format response:',
          '{',
          '  "intent": "GREETING" | "ASK_PRICE" | "REQUEST_PROPOSAL" | "FOLLOW_UP" | "GENERAL_QUESTION" | "OTHER",',
          '  "confidence": 0.0-1.0,',
          '  "extracted": {',
          '    "building_type": "rumah" | "cafe" | "restoran" | "kantor" | "villa" | "ruko" | "renovasi" | null,',
          '    "tier": "ekonomi" | "standar" | "menengah" | "premium" | null,',
          '    "area_sqm": number | null,',
          '    "service_type": "arsitektur" | "interior" | "komersial" | "lansekap" | "pengawasan" | null',
          '  },',
          '  "needs_human": false,',
          '  "reason": "singkat kenapa intent ini"',
          '}'
        ].join('\n')
      },
      {
        role: 'user',
        content: text
      }
    ]
  },
  json: true
});

const raw = response.choices[0].message.content;

let classification;
try {
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  classification = JSON.parse(cleaned);
} catch(e) {
  classification = {
    intent: 'OTHER',
    confidence: 0.5,
    extracted: {},
    needs_human: true,
    reason: 'Parse failed: ' + e.message
  };
}

const messageData = $input.first().json;

return [{
  json: {
    ...messageData,
    intent: classification.intent || 'OTHER',
    confidence: classification.confidence || 0.5,
    extracted: classification.extracted || {},
    needs_human: classification.needs_human || false,
    classifierReason: classification.reason || ''
  }
}];
