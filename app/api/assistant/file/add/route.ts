import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const assistantName = formData.get('assistantName') as string;
    const file = formData.get('file') as File;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Save the file to a temporary directory
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.promises.writeFile(tempPath, buffer);

    const pinecone = new Pinecone();
    const assistant = pinecone.assistant(assistantName);
    
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    // Pass the file path along with metadata including userid, email, date, and time
    await assistant.uploadFile({
        path: tempPath,
        metadata: {
            userid: user.id,
            email: user.email || '',
            date,
            time
        }
    });

    await fs.promises.unlink(tempPath);
    
    return NextResponse.json({ message: `File ${file.name} uploaded to ${assistantName}` });
}