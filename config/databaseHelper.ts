import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    setDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Collections
export const COLLECTIONS = {
    USERS: 'users',
    TRIPS: 'trips',
    SETTINGS: 'settings'
};

// Add a document
export const addData = async (collectionName: string, data: any) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
};

// Set a document with a specific ID
export const setDocument = async (collectionName: string, docId: string, data: any) => {
    try {
        await setDoc(doc(db, collectionName, docId), {
            ...data,
            updatedAt: Timestamp.now()
        }, { merge: true });
    } catch (error) {
        console.error("Error setting document: ", error);
        throw error;
    }
};

// Get a single document
export const getDocument = async (collectionName: string, docId: string) => {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting document: ", error);
        throw error;
    }
};

// Query documents
export const queryDocuments = async (collectionName: string, field: string, operator: any, value: any) => {
    try {
        const q = query(collection(db, collectionName), where(field, operator, value));
        const querySnapshot = await getDocs(q);
        const results: any[] = [];
        querySnapshot.forEach((doc) => {
            results.push({ id: doc.id, ...doc.data() });
        });
        return results;
    } catch (error) {
        console.error("Error querying documents: ", error);
        throw error;
    }
};
