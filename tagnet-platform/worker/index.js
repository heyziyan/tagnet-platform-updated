const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const ORDER_STATUSES = ['Order placed','Confirmed','Processing','Shipped','Delivered','Cancelled'];
function response(data, status=200, extra={}) { return new Response(JSON.stringify(data), {status, headers:{...JSON_HEADERS,...extra}}); }
function cors(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean);
  const allow = allowed.includes(origin) || origin.endsWith('.pages.dev') || origin.endsWith('.workers.dev');
  return {'access-control-allow-origin': allow ? origin : (allowed[0] || 'null'), 'access-control-allow-methods':'GET,POST,PUT,PATCH,OPTIONS','access-control-allow-headers':'content-type,authorization,x-edit-key','access-control-max-age':'86400','vary':'Origin'};
}
function json(data,status=200,headers={}) { return response(data,status,headers); }
function safeProfile(row) { if(!row)return null; const {edit_key_hash,nfc_uid,...publicProfile}=row; return {...publicProfile,published:!!publicProfile.published}; }
async function sha256(value){const bytes=new TextEncoder().encode(String(value));const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function admin(request,env){const h=request.headers.get('Authorization')||'';return !!env.ADMIN_API_KEY && h===`Bearer ${env.ADMIN_API_KEY}`;}
function slugify(s){return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)}
function orderId(){return 'TN-'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase()}
async function body(request){try{return await request.json()}catch{return null}}
export default {
 async fetch(request,env){
  const corsHeaders=cors(request,env); if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders});
  const url=new URL(request.url); const path=url.pathname.replace(/\/$/,'')||'/';
  try{
   if(path==='/api/health')return json({ok:true,service:'Tagnet API',time:new Date().toISOString()},200,corsHeaders);
   if(path==='/api/products'&&request.method==='GET'){
    const {results}=await env.DB.prepare('SELECT id,name,price,stock,status FROM products WHERE status = ? ORDER BY created_at DESC').bind('Active').all();return json({products:results},200,corsHeaders);
   }
   if(path.startsWith('/api/profiles/')&&request.method==='GET'){
    const publicId=decodeURIComponent(path.split('/').pop());const row=await env.DB.prepare('SELECT * FROM profiles WHERE public_id=? AND published=1').bind(publicId).first();if(!row)return json({error:'Profile not found'},404,corsHeaders);
    await env.DB.batch([env.DB.prepare('UPDATE profiles SET views=views+1 WHERE public_id=?').bind(publicId),env.DB.prepare('INSERT INTO profile_events(public_id,event,referrer) VALUES(?,?,?)').bind(publicId,'view',request.headers.get('Referer')||'')]);
    return json({profile:safeProfile({...row,views:row.views+1})},200,{...corsHeaders,'cache-control':'no-store'});
   }
   if(path.startsWith('/api/profiles/')&&request.method==='PUT'){
    const publicId=decodeURIComponent(path.split('/').pop());const key=request.headers.get('X-Edit-Key');const old=await env.DB.prepare('SELECT edit_key_hash,slug FROM profiles WHERE public_id=?').bind(publicId).first();if(!old||!key||old.edit_key_hash!==await sha256(key))return json({error:'Invalid edit key'},403,corsHeaders);const slug=old.slug;
    const b=await body(request);if(!b)return json({error:'Invalid JSON'},400,corsHeaders);const allowed=['name','role','bio','avatar','theme','email','phone','whatsapp','instagram','linkedin','github','website','location','accent','published'];const updates=allowed.filter(k=>b[k]!==undefined);if(!updates.length)return json({error:'No editable fields supplied'},400,corsHeaders);
    const values=updates.map(k=>k==='published'?(b[k]?1:0):String(b[k]??''));const sql=`UPDATE profiles SET ${updates.map(k=>`${k}=?`).join(', ')}, updated_at=datetime('now') WHERE slug=?`;
    await env.DB.prepare(sql).bind(...values,slug).run();const row=await env.DB.prepare('SELECT * FROM profiles WHERE slug=?').bind(slug).first();return json({profile:safeProfile(row)},200,corsHeaders);
   }
   if(path==='/api/profiles'&&request.method==='POST'){
    const b=await body(request);if(!b||!b.name||!b.editKey)return json({error:'name and editKey are required'},400,corsHeaders);const slug=slugify(b.slug||b.name);if(!slug)return json({error:'Choose a valid username'},400,corsHeaders);const exists=await env.DB.prepare('SELECT slug FROM profiles WHERE slug=?').bind(slug).first();if(exists)return json({error:'Username already taken'},409,corsHeaders);const publicId='tg-'+crypto.randomUUID().replace(/-/g,'').slice(0,12).toLowerCase();
    await env.DB.prepare('INSERT INTO profiles(slug,public_id,name,role,bio,avatar,theme,email,phone,whatsapp,instagram,linkedin,github,website,location,accent,edit_key_hash,published,nfc_uid) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(slug,publicId,b.name,b.role||'',b.bio||'',b.avatar||'',b.theme||'editorial',b.email||'',b.phone||'',b.whatsapp||'',b.instagram||'',b.linkedin||'',b.github||'',b.website||'',b.location||'',b.accent||'#b7a0f6',await sha256(b.editKey),b.published?1:0,b.nfcUid||null).run();const row=await env.DB.prepare('SELECT * FROM profiles WHERE public_id=?').bind(publicId).first();return json({profile:safeProfile(row),editKey:b.editKey},201,corsHeaders);
   }
   if(path==='/api/orders'&&request.method==='POST'){
    const b=await body(request);const required=['name','phone','address','city','pincode','productId'];if(!b||required.some(k=>!b[k])||!Number.isInteger(Number(b.qty))||Number(b.qty)<1||Number(b.qty)>10)return json({error:'Please provide valid order details'},400,corsHeaders);
    const product=await env.DB.prepare('SELECT * FROM products WHERE id=? AND status=?').bind(b.productId,'Active').first();if(!product)return json({error:'Product unavailable'},404,corsHeaders);if(product.stock<Number(b.qty))return json({error:'Not enough stock available'},409,corsHeaders);
    const id=orderId(),tracking='TNT'+crypto.randomUUID().replace(/-/g,'').slice(0,8).toUpperCase(),total=product.price*Number(b.qty);const statements=[env.DB.prepare('INSERT INTO orders(id,customer_name,phone,email,address,city,pincode,product_id,product_name,qty,total,status,tracking_code,profile_slug) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,b.name,String(b.phone),b.email||'',b.address,b.city,b.pincode,product.id,product.name,Number(b.qty),total,'Order placed',tracking,''),env.DB.prepare('UPDATE products SET stock=stock-? WHERE id=? AND stock>=?').bind(Number(b.qty),product.id,Number(b.qty)),env.DB.prepare('INSERT INTO order_events(order_id,status,note) VALUES(?,?,?)').bind(id,'Order placed','Order created')];await env.DB.batch(statements);return json({order:{id,total,status:'Order placed',trackingCode:tracking,createdAt:new Date().toISOString()}},201,corsHeaders);
   }
   if(path==='/api/orders/track'&&request.method==='GET'){
    const id=url.searchParams.get('order')||'',last4=(url.searchParams.get('phoneLast4')||'').slice(-4);if(!id||last4.length!==4)return json({error:'Order ID and last four phone digits are required'},400,corsHeaders);const row=await env.DB.prepare('SELECT id,customer_name,phone,city,pincode,product_name,qty,total,status,tracking_code,created_at FROM orders WHERE id=?').bind(id.toUpperCase()).first();if(!row||String(row.phone).slice(-4)!==last4)return json({error:'Order ID or phone verification did not match'},404,corsHeaders);const {phone,...safeOrder}=row;return json({order:{...safeOrder,phone:'••••'+String(phone).slice(-4)},events:(await env.DB.prepare('SELECT status,note,created_at FROM order_events WHERE order_id=? ORDER BY id').bind(row.id).all()).results},200,corsHeaders);
   }
   if(path.startsWith('/api/admin/')){
    if(!admin(request,env))return json({error:'Unauthorized'},401,corsHeaders);
    if(path==='/api/admin/overview'&&request.method==='GET'){
     const [orders,profiles,products,views,revenue]=await Promise.all([env.DB.prepare('SELECT COUNT(*) n FROM orders').first(),env.DB.prepare('SELECT COUNT(*) n FROM profiles WHERE published=1').first(),env.DB.prepare('SELECT COUNT(*) n FROM products WHERE stock<15 AND status="Active"').first(),env.DB.prepare('SELECT COALESCE(SUM(views),0) n FROM profiles').first(),env.DB.prepare('SELECT COALESCE(SUM(total),0) n FROM orders WHERE status="Delivered"').first()]);return json({orders:orders.n,publishedProfiles:profiles.n,lowStockProducts:products.n,profileViews:views.n,deliveredRevenue:revenue.n},200,corsHeaders);
    }
    if(path==='/api/admin/orders'&&request.method==='GET')return json({orders:(await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').all()).results},200,corsHeaders);
    if(path.startsWith('/api/admin/orders/')&&request.method==='PATCH'){
     const id=decodeURIComponent(path.split('/').pop()),b=await body(request);if(!b||!ORDER_STATUSES.includes(b.status))return json({error:'Invalid order status'},400,corsHeaders);await env.DB.batch([env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status,id),env.DB.prepare('INSERT INTO order_events(order_id,status,note) VALUES(?,?,?)').bind(id,b.status,b.note||'Status updated by admin')]);return json({ok:true},200,corsHeaders);
    }
    if(path==='/api/admin/products'&&request.method==='GET')return json({products:(await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all()).results},200,corsHeaders);
    if(path==='/api/admin/products'&&request.method==='POST'){
     const b=await body(request);if(!b||!b.name||!Number.isFinite(Number(b.price))||!Number.isInteger(Number(b.stock)))return json({error:'name, price and integer stock are required'},400,corsHeaders);const id='TK-'+crypto.randomUUID().replace(/-/g,'').slice(0,6).toUpperCase();await env.DB.prepare('INSERT INTO products(id,name,price,stock,status) VALUES(?,?,?,?,?)').bind(id,b.name,Number(b.price),Number(b.stock),b.status||'Active').run();return json({id},201,corsHeaders);
    }
    if(path.startsWith('/api/admin/products/')&&request.method==='PATCH'){
     const id=decodeURIComponent(path.split('/').pop()),b=await body(request);const allowed=['name','price','stock','status'];const keys=allowed.filter(k=>b&&b[k]!==undefined);if(!keys.length)return json({error:'No editable fields'},400,corsHeaders);await env.DB.prepare(`UPDATE products SET ${keys.map(k=>`${k}=?`).join(', ')} WHERE id=?`).bind(...keys.map(k=>b[k]),id).run();return json({ok:true},200,corsHeaders);
    }
    if(path==='/api/admin/profiles'&&request.method==='GET')return json({profiles:(await env.DB.prepare('SELECT slug,name,role,avatar,theme,views,published,created_at,updated_at FROM profiles ORDER BY created_at DESC').all()).results},200,corsHeaders);
    if(path==='/api/admin/analytics'&&request.method==='GET'){
     const byProfile=(await env.DB.prepare("SELECT public_id,COUNT(*) views FROM profile_events WHERE created_at >= datetime('now','-30 days') GROUP BY public_id ORDER BY views DESC").all()).results;const daily=(await env.DB.prepare("SELECT substr(created_at,1,10) day,COUNT(*) views FROM profile_events WHERE created_at >= datetime('now','-30 days') GROUP BY day ORDER BY day").all()).results;return json({byProfile,daily},200,corsHeaders);
    }
   }
   return json({error:'Not found'},404,corsHeaders);
  }catch(err){return json({error:'Internal server error',detail:env.ENVIRONMENT==='development'?String(err):undefined},500,corsHeaders)}
 }
};
