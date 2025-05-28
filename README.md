# Hey Bear

## Overview
Hey Bear is a platform for creating AI assistants with document context. The application uses Supabase for the backend and integrates with Pinecone for vector storage and Twilio for phone number assignment.

## Setup

### Database Types
To generate database types:
```bash
supabase gen types typescript --project-id rvdmjugbsdrhmawldfug > lib/db.types.ts
```

### Environment Variables
Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PINECONE_API_KEY=your_pinecone_api_key
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
```

## Features

### Pinecone Integration
Files are stored and vectorized in Pinecone to enable semantic search across documents. Each assistant is assigned a unique Pinecone namespace.

### Twilio Integration
Assistants can be assigned phone numbers through Twilio, allowing them to be contacted via SMS and voice calls.

## API Clients

### Pinecone File Client
- `uploadFile` - Upload a file to Pinecone
- `deleteFile` - Delete a file from Pinecone
- `searchFiles` - Search for files by content
- `getFiles` - Get all files for an assistant

### Twilio Phone Client
- `provisionTwilioNumber` - Provision a new Twilio phone number
- `assignTwilioNumber` - Assign a phone number to an assistant
- `releaseTwilioNumber` - Release a phone number from an assistant
- `updateTwilioWebhooks` - Update webhook URLs for a phone number

## Testing

To test the Pinecone and Twilio integration:
```bash
pnpm ts-node scripts/test-pinecone-twilio.ts [assistant-id]
```

## Migrations
Database migrations are located in the `supabase/migrations` directory. Run migrations with:
```bash
supabase db push
``` 

