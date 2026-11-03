import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const BOOTSTRAP_DOC_PATH = ["system", "bootstrap"];

export function bootstrapDocRef() {
  return doc(db, ...BOOTSTRAP_DOC_PATH);
}

/** True when the first admin has already been created. */
export async function isSetupComplete() {
  try {
    const snap = await getDoc(bootstrapDocRef());
    return Boolean(snap.exists() && snap.data()?.setupComplete === true);
  } catch (error) {
    console.error("Failed to read bootstrap status:", error);
    // Fresh project / rules not deployed yet — allow one-time signup UI.
    return false;
  }
}

/**
 * Persist the first admin profile and lock setup.
 * Throws if setup was already completed (race).
 */
export async function completeBootstrap({ uid, email, username }) {
  const ref = bootstrapDocRef();
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (tx) => {
    const boot = await tx.get(ref);
    if (boot.exists() && boot.data()?.setupComplete === true) {
      throw new Error("SETUP_ALREADY_COMPLETE");
    }

    tx.set(userRef, {
      email,
      username,
      role: "admin",
      createdAt: serverTimestamp(),
    });

    tx.set(ref, {
      setupComplete: true,
      firstAdminUid: uid,
      completedAt: serverTimestamp(),
    });
  });
}
