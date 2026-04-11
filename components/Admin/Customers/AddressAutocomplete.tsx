"use client";

import { useState, useEffect, useRef } from "react";
import { getDistrictSuggestions, getVillageSuggestions } from "@/utils/indonesianRegions";
import { District, Village } from "@/types/indonesianRegions";

interface AddressAutocompleteProps {
  type: 'district' | 'village';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  parentId?: string; // cityId for districts, districtId for villages
  error?: string;
  label: string;
  required?: boolean;
}

export default function AddressAutocomplete({
  type,
  value,
  onChange,
  placeholder,
  disabled = false,
  parentId,
  error,
  label,
  required = false
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<(District | Village)[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update query when value changes externally
  useEffect(() => {
    if (value !== query) {
      setQuery(value || '');
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    timeoutRef.current = setTimeout(() => {
      try {
        let results: (District | Village)[] = [];
        
        if (type === 'district') {
          results = getDistrictSuggestions(query, parentId, 10);
        } else {
          results = getVillageSuggestions(query, parentId, 10);
        }
        
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error(`Error searching ${type}s:`, error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, type, parentId]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: District | Village) => {
    setQuery(suggestion.name);
    onChange(suggestion.name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getPlaceholderText = () => {
    if (disabled) {
      if (type === 'district') {
        return parentId ? "Pilih kota terlebih dahulu" : "Tidak dapat memuat kecamatan";
      } else {
        return parentId ? "Pilih kecamatan terlebih dahulu" : "Tidak dapat memuat kelurahan/desa";
      }
    }
    
    return placeholder || (type === 'district' ? "Ketik nama kecamatan..." : "Ketik nama kelurahan/desa...");
  };

  return (
    <div className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={disabled}
          className={`w-full rounded-lg border px-4 py-2 pr-10 outline-none focus:border-primary ${
            error
              ? "border-red-500 bg-red-50"
              : "border-stroke bg-transparent"
          } ${disabled ? "bg-gray-50 text-gray-500" : ""}`}
          placeholder={getPlaceholderText()}
          autoComplete="off"
        />
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 w-full rounded-lg border border-stroke bg-white shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`px-4 py-2 cursor-pointer border-b border-stroke last:border-b-0 ${
                  index === selectedIndex
                    ? "bg-primary/10"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.name}
                </div>
                {'type' in suggestion && (
                  <div className="text-xs text-gray-500">
                    {suggestion.type === 'desa' ? 'Desa' : 'Kelurahan'}
                  </div>
                )}
              </div>
            ))}
            
            {/* Show "more results" hint if we hit the limit */}
            {suggestions.length === 10 && (
              <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50">
                Ketik lebih spesifik untuk hasil yang lebih akurat
              </div>
            )}
          </div>
        )}
        
        {/* No results message */}
        {showSuggestions && query.length >= 2 && suggestions.length === 0 && !isLoading && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-stroke bg-white shadow-lg">
            <div className="px-4 py-3 text-sm text-gray-500">
              {type === 'district' ? 'Kecamatan tidak ditemukan' : 'Kelurahan/desa tidak ditemukan'}
              <div className="text-xs mt-1">
                Anda dapat mengetik nama secara manual
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {/* Help text */}
      {!disabled && (
        <p className="mt-1 text-xs text-gray-500">
          {type === 'district' 
            ? "Ketik minimal 2 huruf untuk mencari kecamatan"
            : "Ketik minimal 2 huruf untuk mencari kelurahan/desa"
          }
        </p>
      )}
    </div>
  );
}