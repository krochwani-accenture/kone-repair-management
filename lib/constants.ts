'use client';

export const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined'
        ? `${window.location.origin}/api`
        : 'http://localhost:5000/api');

export const REPAIRS_API_URL = process.env.NEXT_PUBLIC_REPAIRS_API_URL || API_URL;

export const AUTH_BYPASSED = true;

export const appNavItems = ['Manage Offer', 'Manage price', 'Differentiate price'];

export const compactButtonSx = {
    height: 32,
    borderRadius: '16px',
    px: 1.5,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'none',
};

export const statusPalette = [
    { label: 'Completed', color: '#17bf63' },
    { label: 'Pending', color: '#9aa0a6' },
    { label: 'In-progress', color: '#fb8500' },
    { label: 'Error', color: '#dc2626' },
];

export interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}