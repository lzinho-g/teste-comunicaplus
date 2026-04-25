import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { Problem } from "../domain/problem";

const COLLECTION = "problems";

// salvar problema no firebase
export async function saveRemoteProblem(problem: Problem) {
  await addDoc(collection(db, COLLECTION), problem);
}

// buscar todos os problemas
export async function loadRemoteProblems(): Promise<Problem[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as Problem),
    id: doc.id,
  }));
}

// atualizar status
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