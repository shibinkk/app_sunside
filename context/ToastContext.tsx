import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';


interface ToastContextType {
    showToast: (message: string, type: ToastType, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{
        message: string;
        type: ToastType;
        visible: boolean;
        title?: string;
    }>({
        message: '',
        type: 'success',
        visible: false,
    });


    const showToast = useCallback((message: string, type: ToastType, title?: string) => {
        setToast({ message, type, visible: true, title });
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                title={toast.title}
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideToast}
            />
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
