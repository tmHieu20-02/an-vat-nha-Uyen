import { useEffect, useState } from 'react';
import './Toast.css';

let toastId = 0;
const listeners = [];
export const showToast = (message, icon = '🛒', type = 'success') => {
    const id = ++toastId;
    listeners.forEach(fn => fn({ id, message, icon, type }));
};

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (t) => {
            setToasts(prev => [...prev, t]);
            setTimeout(() => {
                setToasts(prev => prev.map(p => p.id === t.id ? { ...p, exiting: true } : p));
                setTimeout(() => setToasts(prev => prev.filter(p => p.id !== t.id)), 300);
            }, 2800);
        };
        listeners.push(handler);
        return () => { const i = listeners.indexOf(handler); if (i > -1) listeners.splice(i, 1); };
    }, []);

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type} ${t.exiting ? 'toast--exit' : ''}`}>
                    <span className="toast-icon">{t.icon}</span>
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    );
}
