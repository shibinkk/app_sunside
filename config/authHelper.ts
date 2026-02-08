import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithCredential,
    OAuthProvider
} from 'firebase/auth';
import { auth, db } from './firebase';
import { setDoc, doc } from 'firebase/firestore';

export const signUp = async (email: string, password: string, name: string, extraData?: any) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Firebase Auth profile
        await updateProfile(user, { displayName: name });

        // Save extra data (like phone number) to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name,
            email,
            phoneNumber: extraData?.phoneNumber || '',
            createdAt: new Date().toISOString(),
            ...extraData
        });

        return user;
    } catch (error) {
        throw error;
    }
};

export const signInWithSocial = async (providerName: 'google' | 'facebook' | 'apple', idToken?: string, accessToken?: string) => {
    try {
        let credential;
        if (providerName === 'google') {
            credential = GoogleAuthProvider.credential(idToken || '');
        } else if (providerName === 'facebook') {
            credential = FacebookAuthProvider.credential(accessToken || '');
        } else if (providerName === 'apple') {
            const provider = new OAuthProvider('apple.com');
            credential = provider.credential({
                idToken: idToken || '',
            });
        }

        if (credential) {
            const userCredential = await signInWithCredential(auth, credential);
            return userCredential.user;
        }
        throw new Error('Invalid social credentials');
    } catch (error) {
        throw error;
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const resetPassword = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw error;
    }
};
