"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
}

export default function JsonEditor({ value, onChange }: JsonEditorProps) {
  const { theme } = useTheme();
  const [jsonValue, setJsonValue] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState("");

  // Update local state when props change
  useEffect(() => {
    setJsonValue(JSON.stringify(value, null, 2));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonValue(e.target.value);
    setError("");

    try {
      const newValue = JSON.parse(e.target.value);
      onChange(newValue);
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  return (
    <div className="relative">
      <textarea
        value={jsonValue}
        onChange={handleChange}
        className={`font-mono h-80 w-full rounded border border-stroke bg-white p-4 text-sm text-black focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:text-white ${
          error ? "border-red-500 dark:border-red-500" : ""
        }`}
        style={{
          resize: "vertical",
          minHeight: "320px",
        }}
      />

      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
    </div>
  );
}
