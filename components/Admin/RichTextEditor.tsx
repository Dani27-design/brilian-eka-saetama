"use client";

import { useState, useEffect, ComponentType } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/db/firebase/firebaseConfig";

// Don't import these at the top level
// Instead use dynamic imports inside useEffect

// Add window interface extension
declare global {
  interface Window {
    _draftToHtml: any;
    _convertToRaw: any;
  }
}

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({
  initialContent,
  onChange,
  placeholder = "Start typing...",
}: RichTextEditorProps) => {
  const [editorState, setEditorState] = useState<any>(null);
  const [Editor, setEditor] = useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load all dependencies only on the client side
    const loadEditor = async () => {
      try {
        // Dynamically import everything we need
        const EditorModule = (await import("react-draft-wysiwyg")).Editor;
        const { EditorState, ContentState, convertToRaw } = await import(
          "draft-js"
        );
        const htmlToDraft = (await import("html-to-draftjs")).default;
        const draftToHtml = (await import("draftjs-to-html")).default;

        // Initialize editor state
        let state;
        if (initialContent) {
          try {
            const blocksFromHtml = htmlToDraft(initialContent);
            const contentState = ContentState.createFromBlockArray(
              blocksFromHtml.contentBlocks,
              blocksFromHtml.entityMap,
            );
            state = EditorState.createWithContent(contentState);
          } catch (e) {
            console.error("Failed to parse HTML:", e);
            state = EditorState.createEmpty();
          }
        } else {
          state = EditorState.createEmpty();
        }

        // Save everything we need in state/refs
        setEditorState(state);
        setEditor(() => EditorModule); // Store the Editor component

        // Store these functions for later use
        window._draftToHtml = draftToHtml;
        window._convertToRaw = convertToRaw;
      } catch (error) {
        console.error("Error loading editor:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEditor();
  }, [initialContent]);

  const handleEditorStateChange = (newState) => {
    setEditorState(newState);

    // Only convert when window functions are available
    if (window._draftToHtml && window._convertToRaw && newState) {
      const html = window._draftToHtml(
        window._convertToRaw(newState.getCurrentContent()),
      );
      onChange(html);
    }
  };

  // Image upload handler
  const uploadImageCallback = async (file) => {
    try {
      const fileName = `blog-image-${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `blog/content-images/${fileName}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { data: { link: url } };
    } catch (error) {
      console.error("Error uploading image:", error);
      return { data: { link: "" } };
    }
  };

  if (loading || !Editor) {
    return (
      <div className="flex h-[250px] items-center justify-center bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-500">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-300">
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorStateChange}
        wrapperClassName="rich-editor-wrapper"
        editorClassName="rich-editor px-3 py-2 min-h-[250px] dark:bg-gray-800 dark:text-white"
        placeholder={placeholder}
        toolbar={{
          options: [
            "inline",
            "blockType",
            "list",
            "textAlign",
            "link",
            "image",
          ],
          inline: { options: ["bold", "italic", "underline"] },
          image: {
            uploadCallback: uploadImageCallback,
            alt: { present: true },
            previewImage: true,
          },
        }}
      />
    </div>
  );
};

export default RichTextEditor;
