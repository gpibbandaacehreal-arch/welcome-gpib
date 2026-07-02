import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const url = env['VITE_SUPABASE_URL'];
const key = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(url, key);

async function run() {
  const dummyBuffer = Buffer.from('hello world');
  
  console.log('Testing upload to "beranda-pdf"...');
  const { data: d1, error: e1 } = await supabase.storage
    .from('beranda-pdf')
    .upload('test_dummy.txt', dummyBuffer, { contentType: 'text/plain', upsert: true });
  if (e1) {
    console.error('Upload to "beranda-pdf" failed:', e1.message);
  } else {
    console.log('Upload to "beranda-pdf" success:', d1);
  }

  console.log('Testing upload to "images"...');
  const { data: d2, error: e2 } = await supabase.storage
    .from('images')
    .upload('test_dummy.txt', dummyBuffer, { contentType: 'text/plain', upsert: true });
  if (e2) {
    console.error('Upload to "images" failed:', e2.message);
  } else {
    console.log('Upload to "images" success:', d2);
  }
}

run().catch(console.error);
