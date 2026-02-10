import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button'; // Will create this next
import { createPortal } from 'react-dom';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-40 flex justify-end">
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={cn(
                    "relative w-full max-w-md bg-zinc-900 h-full shadow-2xl border-l border-zinc-800 transition-transform duration-300 ease-in-out transform",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
