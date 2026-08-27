// One-off migration for the move to per-account data.
//
// Two things need doing that Mongoose will not do on its own:
//   1. Drop the old global unique indexes on admissions.email / .mobile.
//      Mongoose creates the new per-owner compound indexes automatically but
//      never removes superseded ones, and while the global indexes survive,
//      two institutes still cannot enrol the same person.
//   2. Report (or adopt) documents written before `owner` existed. They are
//      invisible to the scoped queries until an owner is assigned.
//
// Usage:
//   node migrations/scope-to-owner.js                 # report only
//   node migrations/scope-to-owner.js --adopt <email> # give orphans to that account
//
// Safe to run more than once.

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const envFile =
  process.env.NODE_ENV === "production" &&
  fs.existsSync(path.resolve(__dirname, "..", ".env.production"))
    ? ".env.production"
    : ".env";

require("dotenv").config({ path: path.resolve(__dirname, "..", envFile) });

const STALE_INDEXES = { admissions: ["email_1", "mobile_1"] };
const OWNED = ["admissions", "attendances", "events", "classes", "students"];

const adoptIndex = process.argv.indexOf("--adopt");
const adoptEmail = adoptIndex === -1 ? null : process.argv[adoptIndex + 1];

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  for (const [collection, names] of Object.entries(STALE_INDEXES)) {
    const existing = (await db.collection(collection).indexes()).map((i) => i.name);
    for (const name of names) {
      if (!existing.includes(name)) {
        console.log(`- ${collection}.${name} already gone`);
        continue;
      }
      await db.collection(collection).dropIndex(name);
      console.log(`- dropped ${collection}.${name}`);
    }
  }

  let owner = null;
  if (adoptEmail) {
    owner = await db.collection("users").findOne({ email: adoptEmail });
    if (!owner) {
      console.error(`\nNo account with email ${adoptEmail}; nothing adopted.`);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  for (const collection of OWNED) {
    const orphans = await db
      .collection(collection)
      .countDocuments({ owner: { $exists: false } });
    if (!orphans) continue;

    if (!owner) {
      console.log(`- ${collection}: ${orphans} document(s) with no owner (hidden)`);
      continue;
    }
    const { modifiedCount } = await db
      .collection(collection)
      .updateMany({ owner: { $exists: false } }, { $set: { owner: owner._id } });
    console.log(`- ${collection}: ${modifiedCount} document(s) adopted by ${adoptEmail}`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
})();
