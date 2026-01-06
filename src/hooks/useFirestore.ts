import { useEffect, useState } from 'react';
import { 
  doc, 
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Meal, PlannedMeal, Recipe, DailyGoals } from '../types';

interface JournalEntry {
  date: string;
  meals: Meal[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

interface UserData {
  meals: Meal[];
  journal: JournalEntry[];
  plannedMeals: PlannedMeal[];
  savedRecipes: Recipe[];
  dailyGoals: DailyGoals;
}

const defaultGoals: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fats: 65
};

export function useFirestore() {
  const { user } = useAuth();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setData(doc.data() as UserData);
      } else {
        // Initialize new user with default data
        const initialData: UserData = {
          meals: [],
          journal: [],
          plannedMeals: [],
          savedRecipes: [],
          dailyGoals: defaultGoals
        };
        setData(initialData);
        setDoc(userDocRef, initialData);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const saveData = async (newData: Partial<UserData>) => {
    if (!user) return;
    
    const userDocRef = doc(db, 'users', user.uid);
    const updatedData = { ...data, ...newData };
    await setDoc(userDocRef, updatedData, { merge: true });
  };

  return { data, loading, saveData };
}
