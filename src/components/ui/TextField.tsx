import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { Text } from './Text';

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  prefix?: string | React.ReactNode;
  error?: string | null;
  helperText?: string;
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, prefix, error, helperText, className, containerClassName, id, ...props }, ref) => {
    const inputId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={cn('w-full space-y-1.5 text-left', containerClassName)}>
        {label && (
          <Text variant="overline" htmlFor={inputId}>
            {label}
          </Text>
        )}

        <div
          className={cn(
            'group relative flex items-center h-14 w-full rounded-xl bg-ink-850 border transition-all',
            error
              ? 'border-danger/50 focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/20'
              : 'border-gold-dim hover:border-gold-400/40 focus-within:border-gold-400 focus-within:ring-2 focus-within:ring-gold-400/20'
          )}
        >
          {prefix && (
            <div className="flex items-center pl-4 pr-1 shrink-0 select-none">
              {typeof prefix === 'string' ? (
                <span className="font-ui font-semibold text-gold-300 text-sm tracking-wider px-2 py-1 rounded bg-ink-800/80 border border-gold-dim/50">
                  {prefix}
                </span>
              ) : (
                prefix
              )}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-full bg-transparent px-4 font-sans text-lg font-normal text-ivory-100 placeholder:text-mist-500 focus:outline-none disabled:opacity-50',
              prefix ? 'pl-2' : '',
              className
            )}
            {...props}
          />
        </div>

        {error ? (
          <p className="font-sans text-xs text-danger pt-0.5 leading-tight">{error}</p>
        ) : helperText ? (
          <p className="font-sans text-xs text-mist-400 pt-0.5 leading-tight">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';
