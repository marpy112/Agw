# Deploy the admin, client, and API to Vercel

Use three Vercel projects connected to the same GitHub repository. Deploy the
server first, then use its production URL in the two frontends.

These instructions prepare a test deployment. Existing API authorization needs
work before a public store launch: product/order routes are not consistently
protected, and signup accepts an admin flag from the request. The existing
temporary image collection is also shared across users. Use test data and one
uploader at a time until access control and per-user upload staging are fixed.
Deployment checks do not verify payment processing; use payment test mode.

## 1. Prepare your accounts and settings

- Vercel, with access to the GitHub repository `marpy112/Agw`.
- MongoDB Atlas, or another remotely accessible MongoDB database. If your current
  database is local, deploying the code does not migrate its data. Import your
  data separately, or start with an empty test database.
- The existing Cloudinary account for images.
- The existing Firebase project for Google sign-in.
- A Gmail address and app password for signup/reset emails. The server currently
  uses Gmail SMTP on port 465. `EMAIL_PASS` is the app password, not the normal
  Gmail login password.

For Atlas, create a database user with access to the application database, then
copy **Connect > Drivers > Node.js**'s connection string. Include the intended
database name in the URL, and URL-encode special characters in the password.
Configure **Network Access** to allow the Vercel backend to connect. If using
Vercel Static IPs, allowlist those addresses. For a test cluster without static
egress, Atlas's `0.0.0.0/0` option permits connections from any IP and requires
strong database credentials; allowing only your laptop IP will not work from
Vercel. [Atlas IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/),
[Vercel outbound IP setup](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address).

## 2. Upload the prepared code to GitHub

The clean deployment repository excludes local `.env` files and the original
repository's history. For future updates, clone that repository and work in the
clone so old history containing credentials is not pushed accidentally:

```powershell
git clone https://github.com/marpy112/Agw.git
cd Agw
```

After editing files in the clone:

```powershell
git status --short
git add -A
git diff --cached --stat
git commit -m "Prepare admin client and API for Vercel"
git push origin HEAD
```

Review the staged files before committing. Do not publish server credentials.
The original checkout may still track `.env` files; do not push its old history
to this clean repository. Rotate the Cloudinary secret previously included in
an old source comment and any other private credential that was exposed.
Firebase web configuration and payment publishable key IDs are browser settings;
MongoDB passwords, JWT secrets, SMTP passwords, and Cloudinary API secrets belong
only in the server environment.

## 3. Deploy the server first

In Vercel, choose **Add New > Project**, import your repository, and set:

| Setting | Value |
| --- | --- |
| Project name | Choose a unique name, e.g. `agri-api` |
| Root Directory | `server` |
| Framework Preset | Express (normally detected automatically) |
| Node.js version | 22.x |
| Install Command | Default (`npm install`) |
| Build Command | Leave the default; do not enter `npm start` |
| Output Directory | Leave the default; do not enter `build` |

The exported Express application in `server/index.js` is the entry point. No
legacy `@vercel/node` build configuration is needed.
[Express deployment documentation](https://vercel.com/docs/frameworks/backend/express).

Add these **Environment Variables** for Production and Preview. Use your actual
values, without surrounding quotation marks:

```dotenv
CONNECTION_STRING=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/YOUR_DATABASE
JSON_WEB_TOKEN_SECRET_KEY=YOUR_LONG_RANDOM_SECRET
cloudinary_Config_Cloud_Name=YOUR_CLOUD_NAME
cloudinary_Config_api_key=YOUR_API_KEY
cloudinary_Config_api_secret=YOUR_API_SECRET
EMAIL=YOUR_GMAIL_ADDRESS
EMAIL_PASS=YOUR_GMAIL_APP_PASSWORD
```

Use the exact variable names and capitalization above. Do not set `PORT` on
Vercel. Keep the existing JWT secret if you intentionally want existing tokens
to remain valid; otherwise generate a new random value locally:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Click **Deploy**, then copy the assigned production domain from the project.
The example below is a placeholder; replace it with yours:

```text
https://YOUR-API-PROJECT.vercel.app/api/health
```

Opening this URL should return:

```json
{"success":true,"database":"connected"}
```

The root URL also returns a small API status response. If health returns 503,
check the database URI, credentials, database name, and Atlas network access.
Use **Logs** in the Vercel server project to diagnose errors.

The browser must be able to reach the API domain. A Vercel authentication page
instead of JSON indicates Deployment Protection. Use an appropriately accessible
production domain for browser testing; do not put a protection bypass secret in
React environment variables.

## 4. Deploy the client

Import the **same repository again** as a new Vercel project:

| Setting | Value |
| --- | --- |
| Project name | Choose a unique name, e.g. `agri-client` |
| Root Directory | `client` |
| Framework Preset | Create React App |
| Node.js version | 22.x |
| Build Command | `npm run build` |
| Output Directory | `build` |

Add these environment variables before clicking Deploy:

```dotenv
REACT_APP_BASE_URL=https://YOUR-API-PROJECT.vercel.app
REACT_APP_FIREBASE_API_KEY=YOUR_FIREBASE_WEB_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
REACT_APP_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
REACT_APP_RAZORPAY_KEY_ID=YOUR_RAZORPAY_TEST_KEY_ID
CI=false
```

`REACT_APP_BASE_URL` must have **no trailing slash and no `/api` suffix**. The
application already adds `/api/...` to each request. Get Firebase values from
your existing local configuration or Firebase **Project settings > Your apps >
Web app configuration**; do not invent them.

The current code has existing lint warnings. `CI=false` allows Create React App
to build with those warnings; compilation errors will still fail the build.
React variables are baked into the build: changing them requires a redeployment.
[Create React App on Vercel](https://vercel.com/docs/frameworks/frontend/create-react-app).

## 5. Deploy the admin

Import the **same repository a third time**:

| Setting | Value |
| --- | --- |
| Project name | Choose a unique name, e.g. `agri-admin` |
| Root Directory | `admin` |
| Framework Preset | Create React App |
| Node.js version | 22.x |
| Build Command | `npm run build` |
| Output Directory | `build` |

Add the same variables as the client, including `CI=false`, but omit
`REACT_APP_RAZORPAY_KEY_ID`, which the admin does not use. Deploy.

The included `vercel.json` files handle React routes on page refresh.
Vercel supports importing one repository into multiple projects with different
root directories. [Monorepo documentation](https://vercel.com/docs/monorepos).

## 6. Enable Google sign-in for the deployed sites

In Firebase **Authentication > Settings > Authorized domains**, add the actual
admin and client production hostnames, without `https://` or paths. Also add any
custom domains you later use. Confirm the Google sign-in provider is enabled.
[Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin).

## 7. Test the complete deployment

1. Open `/api/health` on the API domain and confirm the database is connected.
2. Open the client and confirm categories and products load.
3. Open a nested client route and refresh it; it should not return a Vercel 404.
4. Sign in to the admin using an existing admin test account.
5. Upload a small image, save a category/product, and reload to confirm it persists.
6. Test signup verification and password-reset emails.
7. Test cart and order creation with test data and payment test mode.

Keep each image upload batch below **4 MB total**, with at most ten files. The
server uses memory uploads and sends them to Cloudinary. Requests above Vercel's
4.5 MB platform limit may be rejected before the application can respond.
[Function limits](https://vercel.com/docs/functions/limitations#request-body-size).

Existing images stored only in `server/uploads` need migration to Cloudinary and
their database URLs updated; those local files are not durable production media.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Browser requests `localhost` | Latest code is pushed; correct `REACT_APP_BASE_URL` is set; frontend has been redeployed |
| API responds 503 | MongoDB settings and Atlas network access |
| API returns a login page | Vercel Deployment Protection on the selected domain |
| Google reports unauthorized domain | Firebase Authorized domains |
| Firebase reports invalid API key | Correct Firebase values were set before the build |
| Upload returns 413 | Reduce the total upload size below 4 MB |
| Upload returns 502 | Cloudinary credentials and the server logs |
| Frontend build treats warnings as errors | Set `CI=false` and redeploy |
| Frontend refresh returns 404 | Correct Root Directory and included `vercel.json` |

For actual commercial use, select a plan that permits it. Vercel's Hobby plan is
for personal, non-commercial use. [Hobby plan documentation](https://vercel.com/docs/plans/hobby).

## Local verification

```powershell
npm --prefix server test
$env:CI = 'false'
npm --prefix admin run build
npm --prefix client run build
```

Backend tests mock external services and do not send emails, upload images, or
change your database. Live service checks must be completed on your deployment.
