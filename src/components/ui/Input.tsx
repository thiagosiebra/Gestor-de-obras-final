import React, { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    id: string;
}

export const Input = ({ label, error, id, className, ...props }: InputProps) => {
    return (
        <div className={`${styles.container} ${className || ''}`}>
            <div className={styles.inputWrapper}>
                <input
                    id={id}
                    className={styles.input}
                    placeholder=" "
                    {...props}
                />
                <label htmlFor={id} className={styles.label}>
                    {label}
                </label>
            </div>
            {error && <span className={styles.error}>{error}</span>}
        </div>
    );
};
