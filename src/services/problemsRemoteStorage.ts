import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Problem } from "../domain/problem";

const COLLECTION = "problems";

export async function saveRemoteProblem(problem: Problem) {
  await addDoc(collection(db, COLLECTION), problem);
}

export async function loadRemoteProblems(): Promise<Problem[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));

  return snapshot.docs.map((document) => ({
    ...(document.data() as Problem),
    firebaseDocId: document.id,
  }));
}

export async function updateRemoteStatus(
  id: string,
  status: Problem["status"]
) {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { status });
}

export async function updateRemoteProblemVotes(
  problemId: string,
  votes: number,
  votedBy: string[]
) {
  const q = query(collection(db, COLLECTION), where("id", "==", problemId));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Problema não encontrado no Firebase.");
  }

  const documentId = snapshot.docs[0].id;
  const ref = doc(db, COLLECTION, documentId);

  await updateDoc(ref, {
    votes,
    votedBy,
  });
}

export function listenRemoteProblems(
  onChange: (problems: Problem[]) => void,
  onError?: (error: unknown) => void
) {
  return onSnapshot(
    collection(db, COLLECTION),
    (snapshot) => {
      const problems = snapshot.docs.map((document) => ({
        ...(document.data() as Problem),
        firebaseDocId: document.id,
      }));

      onChange(problems);
    },
    (error) => {
      console.warn("Erro ao escutar problemas no Firebase:", error);
      onError?.(error);
    }
  );
}