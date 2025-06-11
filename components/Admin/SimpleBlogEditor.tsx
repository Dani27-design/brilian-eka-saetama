"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Import the markdown editor with SSR disabled
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[250px] items-center justify-center bg-gray-50 dark:bg-gray-800">
      <p className="text-gray-500">Loading editor...</p>
    </div>
  ),
});

interface SimpleBlogEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const SimpleBlogEditor = ({
  initialContent,
  onChange,
}: SimpleBlogEditorProps) => {
  const [value, setValue] = useState(initialContent || "");

  const handleChange = (val) => {
    setValue(val);
    onChange(val);
  };

  return (
    <div className="markdown-editor" data-color-mode="light">
      <MDEditor
        value={value}
        onChange={handleChange}
        height={400}
        preview="edit"
      />
    </div>
  );
};

export default SimpleBlogEditor;
