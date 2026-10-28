# Tagnet Setup Guide — Simple Hinglish

Ye guide beginner ke liye hai. Is project ke do parts hain: (1) React frontend prototype aur (2) Cloudflare Worker + D1 API foundation. Abhi frontend demo data ko browser mein save karta hai; Worker API alag starter hai aur UI se connected nahi hai. Isliye live orders lene se pehle integration complete karna zaroori hai.

---

## 1. PC par project kaise chalana hai

### Step 1 — Node.js install karo

1. Official Node.js website kholo: https://nodejs.org/
2. Current **LTS** version install karo.
3. Install hone ke baad Windows mein Command Prompt ya VS Code terminal kholo.
4. Ye commands run karo:

```bash
node -v
npm -v
```

Dono commands version numbers dikhayengi. Agar `node is not recognized` aaye, PC restart karke dobara try karo ya Node.js installation check karo.

### Step 2 — Project folder open karo

1. ZIP extract karo, jaise `C:\Users\YourName\Desktop\tagnet-platform`.
2. VS Code install hai toh **File → Open Folder** se `tagnet-platform` folder kholo.
3. VS Code mein **Terminal → New Terminal** select karo.
4. Confirm karo terminal ke path mein `tagnet-platform` aa raha hai.

### Step 3 — Packages install karo

Terminal mein:

```bash
npm install
```

Internet connection ke hisaab se thoda time lagega. Agar error aaye toh exact error copy karke help lo; random files delete mat karo.

### Step 4 — Website start karo

```bash
npm run dev
```

Terminal Vite ka local URL dikhayega, usually:

`http://localhost:5173`

PC ke browser mein URL kholo. Terminal band karoge toh dev server stop ho jayega. Stop karne ke liye terminal mein `Ctrl + C` dabao.

### Step 5 — Demo admin kholo

Browser mein `http://localhost:5173/admin` kholo.

Customer profile creator test karne ke liye `http://localhost:5173/studio` kholo. Profile create karne ke baad screen par permanent public URL aur private edit key milegi. Ye demo data current browser mein hi rahega.

Demo password:

`tagnet-demo-2026`

Ye sirf prototype ke liye hai. Is password ko live admin protection ke roop mein use mat karna.

---

## 2. Apne mobile par kaise test karna hai

PC aur mobile **same Wi-Fi** par hone chahiye.

1. PC par `npm run dev` chalao. Vite config mein `--host 0.0.0.0` already hai.
2. Windows Command Prompt kholo aur run karo:

```bash
ipconfig
```

3. Wi-Fi adapter ke andar `IPv4 Address` dekho, example `192.168.1.8`.
4. Mobile Chrome mein ye kholo:

`http://192.168.1.8:5173`

Apne PC ka actual IP use karna. Agar page nahi khulta:

- Dono devices same Wi-Fi par hain ya nahi check karo.
- PC firewall ka local network prompt aaye toh Node/Vite ko private network par allow karo.
- Guest Wi-Fi/client isolation on ho toh devices ek doosre ko access nahi kar paayenge.
- Mobile data off karke same Wi-Fi try kar sakte ho.

Ye local testing URL sirf tumhare local network ke liye hai. Public internet par accessible nahi hota.

---

## 3. Code mein changes kaise karne hain

### Design / colours / spacing

- `src/styles.css` — almost saari visual styling yahan hai.
- `src/App.tsx` — pages, UI components, sample data aur demo behavior yahan hai.

Example: main background colour change karna ho, `src/styles.css` ke top par `:root` mein:

```css
:root {
  --paper: #f7f5f0;
  --ink: #25241f;
}
```

`--paper` ko `#fffaf2` karoge toh background tone warmer hoga. Save karte hi Vite browser mein changes reload karega.

### Product price change karna

Demo mode mein sample products `src/App.tsx` ke top par `seedProducts` array mein hain. Example:

```ts
{ id: 'TK-01', name: 'Tagnet NFC Keychain · Cloud', price: 199, stock: 48, status: 'Active' }
```

`price: 199` demo price hai. Production mein price server/database se aana chahiye; customer browser ke data ko trusted price nahi maanna.

### Sample profile edit karna

`src/App.tsx` mein `seedProfiles` demo profile objects hain. Unmein name, bio, avatar URL, theme, links, etc. hain. Live product mein real profile records database se load hone chahiye.

### New React component add karna

1. `src/` ke andar nayi file banao, example `ContactButton.tsx`.
2. Component define karo:

```tsx
export default function ContactButton() {
  return <button className="button button-dark">Save contact</button>;
}
```

3. Jis file mein use karna hai, wahan import karo:

```tsx
import ContactButton from './ContactButton';
```

4. JSX mein `<ContactButton />` likho.
5. Styling `src/styles.css` mein add karo.

### React se Next.js par kab move karein?

Abhi move karna zaroori nahi. React + Vite prototype ko polish karo. Next.js par tab consider karo jab server-rendered public profiles, search-engine indexing, metadata per profile, ya ek unified full-stack architecture ki actual need ho. React component concepts similar rahenge, lekin routing, server-side code, environment variables aur Cloudflare deployment process alag hoga. Direct copy-paste se pehle migration plan banana chahiye.

---

## 4. Build check kaise karna hai

Code change ke baad terminal mein:

```bash
npm run build
```

Agar successful ho, `dist/` folder banega. Agar TypeScript error aaye toh error mein file name aur line number dekho. Error solve kiye bina live deploy mat karo.

Preview build:

```bash
npm run preview
```

---

## 5. Cloudflare par frontend free plan mein deploy karna

Cloudflare plans/limits badal sakte hain; launch se pehle official pricing aur limits check karna.

### Step 1 — Code GitHub par push karo

1. GitHub account banao/login karo.
2. New private repository banao, e.g. `tagnet-platform`.
3. Project folder mein `.gitignore` file included hai; `.env` ya secrets kabhi commit mat karo.
4. VS Code Source Control se commit/push kar sakte ho, ya Git CLI use karo.

### Step 2 — Cloudflare Pages connect karo

1. Cloudflare dashboard kholo: https://dash.cloudflare.com/
2. Workers & Pages / Pages mein new project create karo.
3. GitHub repository connect karo.
4. Framework preset `Vite` select karo.
5. Build command: `npm run build`
6. Build output directory: `dist`
7. Deploy karo.

Cloudflare tumhe ek `*.pages.dev` URL dega. Us URL ko mobile par kholo. Ye URL public internet se accessible hoga.

Alternative CLI deploy (project pehle dashboard mein create hona chahiye):

```bash
npm run build
npx wrangler pages deploy dist --project-name tagnet-storefront
```

### Step 3 — Custom domain

Baad mein apna domain connect kar sakte ho. Domain free Pages URL se alag hota hai aur aam taur par domain khareedna padta hai. Abhi budget bachane ke liye Pages URL par prototype test kar sakte ho.

**Important:** Current frontend browser `localStorage` use karta hai. Cloudflare Pages par deploy karne se demo data tumhare browser mein hi rahega; sab customers ka shared database nahi banega. Live customers ke liye neeche wala backend integration complete karna hoga.

---

## 6. Cloudflare D1 + Worker API setup

Ye section backend foundation deploy karta hai. Is step ke baad bhi current frontend automatically backend se connect nahi hoga.

### Step 1 — Wrangler login

Project folder ke terminal mein:

```bash
npx wrangler login
```

Browser mein Cloudflare login/permission flow complete karo.

### Step 2 — D1 database create karo

```bash
npx wrangler d1 create tagnet-db
```

Command output mein database ID milegi. `wrangler.toml` kholo aur:

```toml
database_id = "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

ko actual ID se replace karo. Database name `tagnet-db` same rakho.

### Step 3 — Schema remote database mein apply karo

```bash
npx wrangler d1 execute tagnet-db --remote --file=worker/schema.sql
```

Isse products, profiles, orders, order events aur profile events tables create honge, aur demo products insert honge.

### Step 4 — Admin API secret set karo

Strong, unique random secret generate karo. Is secret ko source code, README, screenshot, GitHub, ya `VITE_` frontend variable mein mat rakho.

```bash
npx wrangler secret put ADMIN_API_KEY
```

Prompt aaye toh secret paste karo. Ye Worker admin API routes ko protect karta hai, lekin current demo UI is secret ko use nahi karti. Isliye UI/API authentication integration abhi pending hai.

### Step 5 — Worker deploy karo

```bash
npm run worker:deploy
```

Deploy output mein Worker URL milega, jaise:

`https://tagnet-api.YOUR-SUBDOMAIN.workers.dev`

Health check:

`https://tagnet-api.YOUR-SUBDOMAIN.workers.dev/api/health`

Expected response mein `ok: true` aana chahiye.

### Step 6 — CORS update karo

`wrangler.toml` mein `ALLOWED_ORIGIN` ko apne actual Pages URL par set karo, example:

```toml
[vars]
ALLOWED_ORIGIN = "https://YOUR-PROJECT.pages.dev"
```

Agar local Worker API ko frontend se test karoge, local origin ko comma-separated list mein add karna padega. Phir Worker dobara deploy karo.

---

## 7. NFC URL ka sahi design — ek baar write, baad mein profile update

Ye Tagnet ke liye critical hai.

### Sahi flow

1. Profile create hote waqt backend random permanent `publicId` banata hai, example `tg-a1b2c3d4e5f6`.
2. Public URL hota hai: `https://YOUR-DOMAIN/p/tg-a1b2c3d4e5f6`.
3. Manufacturer/admin NFC chip par **ye URL ek baar** write karta hai.
4. Customer profile editor mein name, bio, image, phone ya social links update karta hai.
5. Same `publicId` record update hota hai, isliye NFC URL same rehta hai.

### Customer ko NFC app install karni padegi?

Nahi. Customer apne compatible phone ko keychain ke paas laata hai; phone browser mein URL open kar sakta hai. Customer ko tag write karne wali app ki zaroorat nahi hai. **NFC chip ko initial URL likhne ka kaam tum/manufacturer fulfilment ke waqt karoge.** Ye physical writing step website akeli nahi kar sakti.

Compatibility, phone settings, browser behavior aur network connection ko real Android/iPhone devices par test karna zaroori hai. QR code fallback useful hai.

### Profile username badalne ka rule

Username/handle aur `publicId` alag hain. Handle change ho sakta hai, permanent NFC URL mein public ID use karo. Public ID ko kabhi normal profile edit screen mein change na karna. NFC tag par wahi original URL rehna chahiye.

---

## 8. Orders, payment, shipping aur tracking — live karne se pehle

Prototype checkout demo order banata hai. Worker API order create/track endpoints ka starter provide karta hai. Real commerce ke liye:

1. Frontend checkout ko `POST /api/orders` se connect karo.
2. Server-side product price and stock verify ho — browser ke bheje total ko trust mat karo.
3. Payment gateway integrate karo; payment success sirf frontend redirect se confirm mat karo. Server-side verification/webhook chahiye.
4. COD ya manual payment option choose karo agar gateway abhi integrate nahi karna.
5. Shipping address ko secure database mein store karo aur access limited rakho.
6. Order status admin API se update karo.
7. Tracking page `GET /api/orders/track` call kare. Worker API mein order ID ke saath phone ke last 4 digits mandatory hain; production mein rate limiting aur privacy protections bhi review karo.
8. Courier provider integration ho toh actual tracking events display karo; warna manual status updates ko clearly label karo.

---

## 9. Traffic kitna handle karega?

Is prototype ko dekhkar exact number promise nahi kiya ja sakta. Capacity frontend assets, Worker requests, D1 queries, images, caching, rate limits aur provider plan par depend karti hai.

Launch se pehle:

- Lighthouse/mobile performance test karo.
- Static images compress karo; images ko apne storage/CDN par host karne ka plan banao.
- API endpoints ke liye load test run karo.
- D1 query/index performance check karo.
- Cloudflare Workers aur D1 current plan limits padho.
- Error logs, abuse/rate limits aur backups configure karo.

Pehle small batch/soft launch karo. Real data aur request metrics ke bina “10,000 users guaranteed” jaise claims mat karna.

---

## 10. Important production checklist

- [ ] Frontend Worker API se connected
- [ ] Demo `localStorage` mode production build se removed/disabled
- [ ] Secure admin authentication, session expiry, role checks
- [ ] Profile edit access secure; edit keys hashed and never returned again after creation
- [ ] Public profile ID immutable
- [ ] Unique username and profile creation rate limits
- [ ] Server-side price/stock checks and transaction handling
- [ ] Payment gateway verification/webhooks or clearly configured COD/manual payments
- [ ] Privacy policy, terms, refund/return, shipping, support contact
- [ ] Secure image uploads and input/link validation
- [ ] HTTPS and real NFC tag testing
- [ ] Order notifications and actual fulfilment process
- [ ] Database backup and restore test
- [ ] Mobile, accessibility, performance and load testing

**Launch rule:** jab tak production authentication, database integration, payment/fulfilment process aur privacy setup complete na ho, is prototype par real customers ka sensitive data ya payment collect mat karna.
