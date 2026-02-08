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
import { auth } from './firebase';

export const signUp = async (email: string, password: string, name: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await sendEmailVerification(userCredential.user);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
};

export const signInWithSocial = async (providerName: 'google' | 'facebook' | 'apple', idToken?: string, accessToken?: string) => {
    try {
        let credential;
        if (providerName === 'google') {
            credential = GoogleAuthProvider.credential(idToken);
        } else if (providerName === 'facebook') {
            credential = FacebookAuthProvider.credential(accessToken);
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
