// frontend/src/components/QuickCalculator.jsx
import React, { useState } from 'react';
import { calculatorService } from '../services/calculatorService';
import { authService } from '../services/authService';

export default function QuickCalculator({ onApplyValue, onClose }) {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');

    // Helper to format numbers with commas and decimals
    const formatNumber = (valStr) => {
        if (!valStr || valStr === 'Error') return valStr;
        if (valStr.endsWith('.')) {
            const parts = valStr.split('.');
            const integerPart = Number(parts[0]).toLocaleString('en-US');
            return integerPart + '.';
        }
        const num = parseFloat(valStr);
        if (isNaN(num)) return valStr;

        if (valStr.includes('.')) {
            const [integerPart, decimalPart] = valStr.split('.');
            return `${Number(integerPart).toLocaleString('en-US')}.${decimalPart}`;
        }

        return num.toLocaleString('en-US');
    };

    const handleDigit = (digit) => {
        setDisplay(prev => (prev === '0' ? digit : prev + digit));
    };

    const handleOperator = (op) => {
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
    };

    const handleClear = () => {
        setDisplay('0');
        setEquation('');
    };

    const handleCalculate = () => {
        try {
            const fullExpr = equation + display;
            const result = Function('"use strict";return (' + fullExpr + ')')();
            const formattedResult = String(result);

            const currentUser = authService.getCurrentUser();
            if (currentUser) {
                calculatorService.logCalculation(fullExpr, formattedResult, currentUser.id);
            }

            setDisplay(formattedResult);
            setEquation('');
        } catch {
            setDisplay('Error');
        }
    };

    const handleDecimal = () => {
        if (!display.includes('.')) {
            setDisplay(prev => prev + '.');
        }
    };

    const handleSendToPOS = () => {
        const cleanVal = parseFloat(display.replace(/,/g, ''));
        if (onApplyValue && !isNaN(cleanVal)) {
            onApplyValue(cleanVal);
        }
    };

    const btnStyle = {
        padding: '15px',
        fontSize: '18px',
        fontWeight: 'bold',
        background: '#e9ecef',
        border: '1px solid #ced4da',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#343a40'
    };

    return (
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #dee2e6', width: '280px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative' }}>
            
            {/* Header with Title and Always-Visible Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#495057' }}>Quick Calculator</span>
                <button 
                    onClick={onClose || (() => window.history.back())} 
                    style={{ background: '#fa5252', color: '#fff', border: 'none', borderRadius: '4px', width: '24px', height: '24px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Close Calculator"
                >
                    ✕
                </button>
            </div>

            <div style={{ marginBottom: '10px', background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #ced4da', textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#6c757d', minHeight: '15px', overflowX: 'auto' }}>{equation}</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#212529', overflowX: 'auto', marginTop: '4px' }}>
                    {formatNumber(display)}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <button onClick={handleClear} style={{ ...btnStyle, background: '#ff6b6b', color: '#fff' }}>C</button>
                <button onClick={() => handleOperator('/')} style={{ ...btnStyle, background: '#dee2e6' }}>÷</button>
                <button onClick={() => handleOperator('*')} style={{ ...btnStyle, background: '#dee2e6' }}>×</button>
                <button onClick={() => setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')} style={{ ...btnStyle, background: '#dee2e6' }}>⌫</button>

                <button onClick={() => handleDigit('7')} style={btnStyle}>7</button>
                <button onClick={() => handleDigit('8')} style={btnStyle}>8</button>
                <button onClick={() => handleDigit('9')} style={btnStyle}>9</button>
                <button onClick={() => handleOperator('-')} style={{ ...btnStyle, background: '#dee2e6' }}>-</button>

                <button onClick={() => handleDigit('4')} style={btnStyle}>4</button>
                <button onClick={() => handleDigit('5')} style={btnStyle}>5</button>
                <button onClick={() => handleDigit('6')} style={btnStyle}>6</button>
                <button onClick={() => handleOperator('+')} style={{ ...btnStyle, background: '#dee2e6' }}>+</button>

                <button onClick={() => handleDigit('1')} style={btnStyle}>1</button>
                <button onClick={() => handleDigit('2')} style={btnStyle}>2</button>
                <button onClick={() => handleDigit('3')} style={btnStyle}>3</button>
                <button onClick={handleCalculate} style={{ ...btnStyle, background: '#2b8a3e', color: '#fff', gridRow: 'span 2' }}>=</button>

                <button onClick={() => handleDigit('0')} style={{ ...btnStyle, gridColumn: 'span 2' }}>0</button>
                <button onClick={handleDecimal} style={btnStyle}>.</button>
            </div>

            {onApplyValue && (
                <button 
                    onClick={handleSendToPOS}
                    style={{ width: '100%', marginTop: '10px', padding: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Apply Value to POS ₦
                </button>
            )}
        </div>
    );
}