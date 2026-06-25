import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  : join(__dirname, "serviceAccountKey.json");

const serviceAccount = JSON.parse(await readFile(serviceAccountPath, "utf-8"));
const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || "testing";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });
}
const db =
  FIRESTORE_DATABASE_ID === "(default)"
    ? getFirestore()
    : getFirestore(admin.app(), FIRESTORE_DATABASE_ID);

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

const DRY_RUN = false; // true by default ⚠️

// ── A 24-char hex string = MongoDB ObjectId = migrated doc ──
function isMongoObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id);
}

// Delete specific docs from a Firestore collection by ID
async function deleteMigratedDocs(collectionName, migratedIds) {
  if (!migratedIds.length) return 0;

  const BATCH_SIZE = 500;
  let deleted = 0;

  for (let i = 0; i < migratedIds.length; i += BATCH_SIZE) {
    const chunk = migratedIds.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((docId) => {
      batch.delete(db.collection(collectionName).doc(docId));
    });
    if (!DRY_RUN) await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

async function deleteAll() {
  console.log(`🔥 Firestore Project: ${FIREBASE_PROJECT_ID} | Database: ${FIRESTORE_DATABASE_ID}\n`);
  console.log(`🧪 Dry Run: ${DRY_RUN} ${DRY_RUN ? "— pass DRY_RUN=false to actually delete" : "— deleting for real!"}\n`);
  console.log("=".repeat(55));

  // ── Get all collections in Firestore ──
  const allCollections = await db.listCollections();
  const summary = [];
  const failed = [];

  let totalDeleted = 0;
  let totalKept = 0;

  for (const colRef of allCollections) {
    const collectionName = colRef.id;
    console.log(`\n🔍 Scanning: ${collectionName}`);

    try {
      const snapshot = await db.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`  ⚠️  Empty collection, skipping.`);
        continue;
      }

      // ── Fingerprint: find all docs whose ID looks like a MongoDB ObjectId ──
      const migratedIds = snapshot.docs
        .map((doc) => doc.id)
        .filter(isMongoObjectId);

      const keptCount = snapshot.docs.length - migratedIds.length;

      if (!migratedIds.length) {
        console.log(`  ✅ No migrated docs found, skipping.`);
        continue;
      }

      console.log(`  📄 Total docs      : ${snapshot.docs.length}`);
      console.log(`  🍃 Migrated (mongo): ${migratedIds.length}`);
      console.log(`  🔒 Original (kept) : ${keptCount}`);

      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would delete ${migratedIds.length} doc(s)`);
      } else {
        const deleted = await deleteMigratedDocs(collectionName, migratedIds);
        console.log(`  🗑️  Deleted: ${deleted} doc(s)`);
      }

      summary.push({
        collectionName,
        migrated: migratedIds.length,
        kept: keptCount,
      });

      totalDeleted += migratedIds.length;
      totalKept += keptCount;

    } catch (error) {
      failed.push(collectionName);
      console.error(`  ❌ Failed: ${error?.message || error}`);
    }
  }

  // ── Summary Table ──
  console.log("\n" + "=".repeat(55));
  console.log("📊 DELETION SUMMARY\n");
  console.log("Collection".padEnd(40) + "Deleted  Kept");
  console.log("-".repeat(55));
  for (const row of summary) {
    console.log(
      row.collectionName.padEnd(40) +
      String(row.migrated).padEnd(9) +
      row.kept
    );
  }
  console.log("=".repeat(55));
  console.log(
    "TOTAL".padEnd(40) +
    `${totalDeleted}`.padEnd(9) +
    `${totalKept}`
  );

  if (failed.length) {
    console.log(`\n❌ Failed Collections: ${failed.length}`);
    for (const f of failed) console.log(`   - ${f}`);
  }

  console.log(
    DRY_RUN
      ? "\n🧪 Dry run complete — nothing was deleted."
      : "\n🎉 Done — all migrated docs removed! Original docs untouched."
  );
}

deleteAll().catch(console.error);
