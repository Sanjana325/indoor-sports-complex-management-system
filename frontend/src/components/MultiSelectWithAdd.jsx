
import React, { useState, useRef, useEffect } from 'react';
import '../styles/UserManagement.css'; // We'll add styles here

export default function MultiSelectWithAdd({
    label,
    placeholder,
    value = [],
    options = [],
    onChange,
    onAdd
}) {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(opt)
    );

    const showAddOption = inputValue.trim() &&
        !filteredOptions.some(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) &&
        !value.some(v => v.toLowerCase() === inputValue.trim().toLowerCase());

    const handleSelect = (option) => {
        onChange([...value, option]);
        setInputValue('');
        setIsOpen(false);
    };

    const handleRemove = (optionToRemove) => {
        onChange(value.filter(v => v !== optionToRemove));
    };

    const handleAddNew = async () => {
        if (!inputValue.trim()) return;
        const newItem = inputValue.trim();
        if (onAdd) {
            await onAdd(newItem); // Let parent handle API call and state update
        } else {
            onChange([...value, newItem]);
        }
        setInputValue('');
        setIsOpen(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
            } else if (showAddOption) {
                handleAddNew();
            }
        }
    };

    return (
        <div className="um-field um-full" ref={wrapperRef}>
            <label>{label}</label>
            <div className="um-multiselect-container">
                <div className="um-multiselect-chips">
                    {value.map((item, idx) => (
                        <span key={idx} className="um-chip">
                            {item}
                            <button
                                type="button"
                                className="um-chip-remove"
                                onClick={() => handleRemove(item)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        className="um-multiselect-input"
                        placeholder={value.length === 0 ? placeholder : ""}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {isOpen && (inputValue || filteredOptions.length > 0) && (
                    <ul className="um-multiselect-dropdown">
                        {filteredOptions.map((opt, idx) => (
                            <li key={idx} onClick={() => handleSelect(opt)}>
                                {opt}
                            </li>
                        ))}
                        {showAddOption && (
                            <li className="um-multiselect-add" onClick={handleAddNew}>
                                + Add "{inputValue}"
                            </li>
                        )}
                        {!showAddOption && filteredOptions.length === 0 && (
                            <li className="um-multiselect-empty">No options found</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
}
