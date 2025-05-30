"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import JSONEditor dynamically to prevent SSR issues
const JSONEditor = dynamic(
  () => import("jsoneditor-react").then((mod) => mod.JSONEditor),
  { ssr: false },
) as any;

// And its styles
// import "jsoneditor-react/es/index.css";

// // Using light and dark theme
// import "jsoneditor/dist/themes/jse-theme-dark.css";
import { useTheme } from "next-themes";

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
}

export default function JsonEditor({ value, onChange }: JsonEditorProps) {
  const { theme } = useTheme();
  const [jsonValue, setJsonValue] = useState(value);

  // Update local state when props change
  useEffect(() => {
    setJsonValue(value);
  }, [value]);

  const handleChange = (newValue: any) => {
    setJsonValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="h-[500px] rounded-md border border-stroke dark:border-strokedark">
      {typeof window !== "undefined" && (
        <JSONEditor
          value={jsonValue}
          onChange={handleChange}
          mode="tree"
          theme={theme === "dark" ? "jse-theme-dark" : undefined}
          allowedModes={["tree", "code", "form", "view"]}
          htmlElementProps={{
            style: {
              height: "100%",
              overflow: "auto",
            },
          }}
        />
      )}
    </div>
  );
}
