import React, { useState, useRef, useEffect } from 'react';

// custom select component that handles multiple tag selection and dynamic addition of new choices
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

    // handles auto-closing the dropdown if user clicks elsewhere
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // filters available options based on user text input and excludes already selected items
    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.includes(opt)
    );

    // determines if the current input is unique enough to be added as a new option
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

    // allows creation of new custom items not present in the initial options list
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
                {/* layout for displaying active tags and the text search field */}
                <div className="um-multiselect-chips">
                    {value.map((item, idx) => (
                        /* individual item chip with dismissal support */
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
                    /* floating list showing matched results and the 'add new' prompt */
                    <ul className="um-multiselect-dropdown">
                        {filteredOptions.map((opt, idx) => (
                            <li key={idx} onClick={() => handleSelect(opt)}>
                                {opt}
                            </li>
                        ))}
                        {showAddOption && (
                            /* special item to create an entry from the current text buffer */
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
