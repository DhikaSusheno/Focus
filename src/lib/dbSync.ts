import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch,
  serverTimestamp,
  deleteDoc,
  DocumentReference
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Task, AdhdTarget, RewardItem, Mindmap, JournalSummaryResult } from '../types';

export interface UserProfileData {
  uName: string;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  notepadContent: string;
  ideasCount: number;
  totalFocusMinutes: number;
  activeMindmap: Mindmap | null;
  journalSummary: JournalSummaryResult | null;
}

/**
 * Save user profile stats to Firestore
 */
export async function saveProfileToCloud(userId: string, profile: UserProfileData) {
  const userDocRef = doc(db, 'users', userId);
  try {
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
  }
}

/**
 * Fetch user profile stats from Firestore
 */
export async function fetchProfileFromCloud(userId: string): Promise<UserProfileData | null> {
  const userDocRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    return null;
  }
}

/**
 * Synchronize task list to Cloud
 */
export async function saveTasksToCloud(userId: string, tasks: Task[]) {
  try {
    const batch = writeBatch(db);
    
    // For each task, add of edit
    for (const task of tasks) {
      const taskDocRef = doc(db, 'users', userId, 'tasks', task.id);
      batch.set(taskDocRef, {
        ...task,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/tasks`);
  }
}

/**
 * Sync single task update or addition
 */
export async function saveSingleTaskToCloud(userId: string, task: Task) {
  const taskDocRef = doc(db, 'users', userId, 'tasks', task.id);
  try {
    await setDoc(taskDocRef, {
      ...task,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/tasks/${task.id}`);
  }
}

/**
 * Delete a single task from cloud
 */
export async function deleteTaskFromCloud(userId: string, taskId: string) {
  const taskDocRef = doc(db, 'users', userId, 'tasks', taskId);
  try {
    await deleteDoc(taskDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/tasks/${taskId}`);
  }
}

/**
 * Fetch all tasks from Cloud
 */
export async function fetchTasksFromCloud(userId: string): Promise<Task[]> {
  const tasksColRef = collection(db, 'users', userId, 'tasks');
  try {
    const querySnap = await getDocs(tasksColRef);
    const tasks: Task[] = [];
    querySnap.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: data.id,
        title: data.title,
        urgency: data.urgency,
        xpReward: data.xpReward,
        coinReward: data.coinReward,
        isCompleted: data.isCompleted,
        notes: data.notes || ''
      });
    });
    return tasks;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/tasks`);
    return [];
  }
}

/**
 * Synchronize targets to Cloud
 */
export async function saveTargetsToCloud(userId: string, targets: AdhdTarget[]) {
  try {
    const batch = writeBatch(db);
    for (const target of targets) {
      const docRef = doc(db, 'users', userId, 'targets', target.id);
      batch.set(docRef, {
        ...target,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/targets`);
  }
}

export async function saveSingleTargetToCloud(userId: string, target: AdhdTarget) {
  const docRef = doc(db, 'users', userId, 'targets', target.id);
  try {
    await setDoc(docRef, {
      ...target,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/targets/${target.id}`);
  }
}

export async function deleteTargetFromCloud(userId: string, targetId: string) {
  const docRef = doc(db, 'users', userId, 'targets', targetId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/targets/${targetId}`);
  }
}

export async function fetchTargetsFromCloud(userId: string): Promise<AdhdTarget[]> {
  const colRef = collection(db, 'users', userId, 'targets');
  try {
    const querySnap = await getDocs(colRef);
    const targets: AdhdTarget[] = [];
    querySnap.forEach((doc) => {
      const data = doc.data();
      targets.push({
        id: data.id,
        title: data.title,
        category: data.category,
        isCompleted: data.isCompleted,
        whyText: data.whyText || ''
      });
    });
    return targets;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/targets`);
    return [];
  }
}

/**
 * Store rewards list
 */
export async function saveRewardsToCloud(userId: string, rewards: RewardItem[]) {
  try {
    const batch = writeBatch(db);
    for (const reward of rewards) {
      const docRef = doc(db, 'users', userId, 'rewards', reward.id);
      batch.set(docRef, {
        ...reward,
        updatedAt: serverTimestamp()
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/rewards`);
  }
}

export async function saveSingleRewardToCloud(userId: string, reward: RewardItem) {
  const docRef = doc(db, 'users', userId, 'rewards', reward.id);
  try {
    await setDoc(docRef, {
      ...reward,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/rewards/${reward.id}`);
  }
}

export async function deleteRewardFromCloud(userId: string, rewardId: string) {
  const docRef = doc(db, 'users', userId, 'rewards', rewardId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/rewards/${rewardId}`);
  }
}

export async function fetchRewardsFromCloud(userId: string): Promise<RewardItem[]> {
  const colRef = collection(db, 'users', userId, 'rewards');
  try {
    const querySnap = await getDocs(colRef);
    const rewards: RewardItem[] = [];
    querySnap.forEach((doc) => {
      const data = doc.data();
      rewards.push({
        id: data.id,
        title: data.title,
        cost: data.cost,
        icon: data.icon,
        type: data.type,
        unlocked: data.unlocked || false
      });
    });
    return rewards;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${userId}/rewards`);
    return [];
  }
}
