'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 8 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const attempts = new Map();
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };

function headers(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com; connect-src 'self'; upgrade-insecure-requests");
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Content-Length':Buffer.byteLength(body) });
  res.end(body);
}
function clientKey(req) { return req.socket.remoteAddress || 'unknown'; }
function limited(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) { attempts.set(key, recent); return true; }
  recent.push(now); attempts.set(key, recent);
  if (attempts.size > 2000) for (const [k, values] of attempts) if (values.every(t => now - t >= WINDOW_MS)) attempts.delete(k);
  return false;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('Request too large.'), { status:413 })); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(Object.assign(new Error('Invalid JSON.'), { status:400 })); } });
    req.on('error', reject);
  });
}
function clean(value, max) {
  return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max) : '';
}
function validate(data) {
  const item = {
    name:clean(data.name,80), email:clean(data.email,254).toLowerCase(),
    date:clean(data.date,10), time:clean(data.time,5),
    guests:Number(data.guests), occasion:clean(data.occasion,40),
    message:clean(data.message,500), website:clean(data.website,120)
  };
  const errors = {};
  if (item.website) errors.form = 'Unable to accept this request.';
  if (item.name.length < 2) errors.name = 'Enter at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(item.email)) errors.email = 'Enter a valid email.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) errors.date = 'Choose a valid date.';
  else {
    const date = new Date(item.date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const max = new Date(today); max.setDate(max.getDate()+180);
    if (Number.isNaN(date.getTime()) || date < today || date > max) errors.date = 'Choose a date within 180 days.';
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)) errors.time = 'Choose a valid time.';
  if (!Number.isInteger(item.guests) || item.guests < 1 || item.guests > 12) errors.guests = 'Choose 1–12 guests.';
  return { item, errors };
}
function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (process.env.NODE_ENV === 'production') return Boolean(process.env.PUBLIC_ORIGIN) && parsed.origin === new URL(process.env.PUBLIC_ORIGIN).origin;
    return parsed.host === req.headers.host && (parsed.protocol === 'https:' || ['localhost','127.0.0.1'].includes(parsed.hostname));
  } catch { return false; }
}
async function reservation(req, res) {
  if (!allowedOrigin(req)) return json(res,403,{ok:false,message:'Request origin could not be verified.'});
  if (!req.headers['content-type']?.includes('application/json')) return json(res,415,{ok:false,message:'Use a JSON request.'});
  if (limited(clientKey(req))) return json(res,429,{ok:false,message:'Too many attempts. Try again later.'});
  let body;
  try { body = await readBody(req); } catch (error) { return json(res,error.status || 400,{ok:false,message:error.message || 'Invalid request.'}); }
  const { errors } = validate(body || {});
  if (Object.keys(errors).length) return json(res,400,{ok:false,message:'Please check your details.',errors});
  return json(res,202,{ok:true,mode:'demo',requestId:crypto.randomUUID(),message:'Your form passed validation. Demo mode does not save or send a real reservation.'});
}
function staticFile(req,res,pathname) {
  let decoded; try { decoded = decodeURIComponent(pathname); } catch { return json(res,400,{ok:false,message:'Bad URL.'}); }
  const target = path.resolve(ROOT, decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, ''));
  if (!target.startsWith(ROOT + path.sep) && target !== path.join(ROOT,'index.html')) return json(res,403,{ok:false,message:'Forbidden.'});
  fs.stat(target,(err,stat) => {
    if (err || !stat.isFile()) return json(res,404,{ok:false,message:'Not found.'});
    res.writeHead(200,{'Content-Type':MIME[path.extname(target).toLowerCase()] || 'application/octet-stream','Content-Length':stat.size,'Cache-Control':path.extname(target)==='.html'?'no-cache':'public, max-age=3600'});
    fs.createReadStream(target).pipe(res);
  });
}
const server = http.createServer(async (req,res) => {
  headers(res);
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  if (req.method === 'GET' && url.pathname === '/health') return json(res,200,{ok:true});
  if (req.method === 'POST' && url.pathname === '/api/reservations') return reservation(req,res);
  if (!['GET','HEAD'].includes(req.method)) return json(res,405,{ok:false,message:'Method not allowed.'});
  return staticFile(req,res,url.pathname);
});
server.listen(PORT,'0.0.0.0',() => process.stdout.write('The Ember Table demo running on port '+PORT+'\n'));
