import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline';
    isLoading?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    isLoading,
    className,
    ...props
}: ButtonProps) => {
    return (
        <button
            className={`${styles.button} ${styles[variant]} ${className || ''}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? <span className={styles.loader}></span> : children}
        </button>
    );
};
