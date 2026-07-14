import { randomBytes } from "node:crypto";

const secrets = [
  ["ADMIN_API_TOKEN", "Use for /admin-beta and protected workspace APIs."],
  ["TRACKING_HASH_SALT", "Use only for stable Site Signal visitor IP hashing."],
];

console.log("Builder Rank production-owned secrets");
console.log("Generate these locally, add them to Vercel production env vars, then discard this terminal output.");
console.log("");

secrets.forEach(([name, note]) => {
  console.log(`${name}=${randomSecret()}`);
  console.log(`# ${note}`);
  console.log(`vercel env add ${name} production`);
  console.log("");
});

console.log("Do not reuse SUPABASE_SERVICE_ROLE_KEY as TRACKING_HASH_SALT.");
console.log("After adding env vars, rerun: npm run production:readiness");

function randomSecret() {
  return `br_${randomBytes(36).toString("base64url")}`;
}
