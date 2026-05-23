# n8n Workflow Setup untuk Sudut Ruang Dashboard

## Overview
Dashboard ini terintegrasi dengan n8n untuk handle komunikasi dengan WhatsApp dan Instagram. n8n bertindak sebagai middleware antara dashboard dan messaging platforms.

## Required n8n Workflows

### 1. **Incoming Messages Handler** (WhatsApp/Instagram → Dashboard)
```
Trigger: WhatsApp/Instagram Webhook
  ↓
Filter & Validate Message
  ↓
Determine AI Confidence (optional - LLM analysis)
  ↓
Check if Manual Mode for this conversation
  ↓
If AI Mode → Send to AI Agent for response
If Manual Mode → Send to Dashboard only
  ↓
Store in Database (conversation history)
  ↓
Send to Dashboard via Webhook/WebSocket
```

**Webhook Output ke Dashboard:**
```json
{
  "conversationId": "conv-123",
  "clientName": "Bpk. Budi",
  "source": "whatsapp",
  "message": {
    "id": "msg-456",
    "content": "Halo, saya mau renovasi apartemen",
    "role": "client",
    "timestamp": "2024-05-23T10:30:00Z"
  },
  "metadata": {
    "phoneNumber": "+62812345678",
    "projectType": null
  }
}
```

### 2. **Dashboard to Client Sender** (Dashboard → WhatsApp/Instagram)
```
Trigger: Webhook dari Dashboard (POST /webhook/dashboard-message)
  ↓
Validate sender (AI atau Human operator)
  ↓
Format message untuk WhatsApp/Instagram API
  ↓
Send via WhatsApp Business API atau Instagram Graph API
  ↓
Store in Database
  ↓
Return delivery status
```

**Expected Input dari Dashboard:**
```json
{
  "conversationId": "conv-123",
  "destination": "whatsapp",
  "recipient": "+62812345678",
  "message": "Terima kasih! Untuk estimasi, boleh tahu luas areanya?",
  "sender": "human",
  "operator": "Andi",
  "timestamp": "2024-05-23T10:32:00Z"
}
```

### 3. **Mode Toggle Handler**
```
Trigger: Webhook dari Dashboard (POST /webhook/toggle-mode)
  ↓
Update conversation mode in Database
  ↓
If switching to Manual → Pause AI Agent untuk conversation ini
If switching to AI → Resume AI Agent
  ↓
Notify monitoring systems
  ↓
Return success response
```

**Expected Input:**
```json
{
  "conversationId": "conv-123",
  "mode": "manual",
  "triggeredBy": "user-id",
  "timestamp": "2024-05-23T10:35:00Z"
}
```

### 4. **Get Conversations** (untuk polling)
```
Trigger: Webhook dari Dashboard (GET /webhook/get-conversations)
  ↓
Query Database untuk active conversations
  ↓
Calculate unread counts
  ↓
Return formatted data
```

**Response Format:**
```json
{
  "conversations": [
    {
      "id": "conv-123",
      "clientName": "Bpk. Budi",
      "source": "whatsapp",
      "status": "active",
      "mode": "ai",
      "lastMessage": "Halo, saya mau renovasi",
      "lastMessageTime": "2024-05-23T10:30:00Z",
      "unreadCount": 2,
      "metadata": {
        "phoneNumber": "+62812345678",
        "projectType": "Apartemen Studio"
      }
    }
  ]
}
```

## Setup Instructions

### Step 1: Import Workflows ke n8n
1. Buka n8n dashboard Anda
2. Create new workflow untuk masing-masing handler di atas
3. Configure webhook nodes dengan paths:
   - `/webhook/incoming-message` (dari WA/IG)
   - `/webhook/dashboard-message` (dari dashboard)
   - `/webhook/toggle-mode` (dari dashboard)
   - `/webhook/get-conversations` (dari dashboard)

### Step 2: Configure WhatsApp Business API
1. Setup Meta Business Account
2. Get WhatsApp Business API credentials
3. Configure webhook di Meta untuk receive messages
4. Add credentials di n8n

### Step 3: Configure Instagram API
1. Setup Instagram Business Account
2. Link ke Facebook Page
3. Get Instagram Graph API credentials
4. Configure webhook di Meta
5. Add credentials di n8n

### Step 4: Setup Database (Airtable/PostgreSQL/MongoDB)
Struktur data minimum:
```
Conversations Table:
- id (primary key)
- client_name
- source (whatsapp/instagram)
- status (active/idle/archived)
- mode (ai/manual)
- phone_number
- ig_username
- last_message
- last_message_time
- unread_count
- metadata (JSON)

Messages Table:
- id (primary key)
- conversation_id (foreign key)
- content
- role (client/ai/human)
- timestamp
- source
- ai_confidence (float)
- metadata (JSON)
```

### Step 5: Update Dashboard Environment
Create `.env` file:
```bash
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
VITE_USE_MOCK_DATA=false
```

### Step 6: Test Integration
1. Send test message dari WhatsApp ke nomor bisnis Anda
2. Check apakah muncul di dashboard
3. Reply dari dashboard
4. Verify message terkirim ke WhatsApp
5. Test mode toggle (AI ↔ Manual)

## AI Agent Integration (Optional)

Untuk AI responses yang lebih smart, tambahkan LLM node:

```
Incoming Message
  ↓
Extract context (project type, budget, etc)
  ↓
Send to LLM (OpenAI/Anthropic/local model) dengan prompt:
  "You are Sudut Ruang assistant. Client asked: {message}
   Context: {conversation_history}
   Generate professional response for interior design inquiry."
  ↓
Parse LLM response + confidence score
  ↓
If confidence < 70% → Flag for human review
  ↓
Send response to client (if AI mode)
```

## WebSocket Alternative (Future Enhancement)

Untuk real-time updates tanpa polling:
1. Setup WebSocket server (Socket.io / native WS)
2. n8n push updates ke WebSocket server
3. Dashboard subscribe via WebSocket client
4. Benefits: instant updates, reduced API calls

## Troubleshooting

**Dashboard tidak menerima messages:**
- Check n8n webhook URLs di `.env`
- Verify n8n workflows active
- Check CORS settings di n8n

**Messages tidak terkirim ke WhatsApp:**
- Verify WhatsApp Business API credentials
- Check phone number format (+62xxx)
- Review n8n execution logs

**AI responses tidak muncul:**
- Check AI mode status
- Verify LLM node configuration
- Review conversation context

## Security Notes

⚠️ **Important:**
- Enable authentication di n8n webhooks (API key/JWT)
- Sanitize user inputs before sending ke LLM
- Rate limit API calls untuk prevent abuse
- Encrypt sensitive data (phone numbers) di database
- Use HTTPS untuk all webhook communications

## Support

Untuk pertanyaan teknis:
- n8n Documentation: https://docs.n8n.io
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Instagram API: https://developers.facebook.com/docs/instagram-api
