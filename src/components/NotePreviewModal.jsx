import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../services/api";

export default function NotePreviewModal({ note, onClose, showToast }) {
  const [textContent, setTextContent] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const previewType = useMemo(() => getPreviewType(note?.fileName || ""), [note]);

  useEffect(() => {
    if (!note) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [note, onClose]);

  useEffect(() => {
    let isCancelled = false;
    let nextPreviewUrl = "";

    async function loadPreview() {
      if (!note) {
        setTextContent("");
        setPreviewUrl("");
        return;
      }

      try {
        setIsLoadingPreview(true);
        const response = await api.get(`/notes/${note.id}/file`, {
          params: { disposition: "inline" },
          responseType: "blob"
        });
        const previewBlob = response.data;

        if (isCancelled) {
          return;
        }

        if (previewType === "text") {
          setTextContent(await previewBlob.text());
          setPreviewUrl("");
          return;
        }

        nextPreviewUrl = window.URL.createObjectURL(previewBlob);
        setPreviewUrl(nextPreviewUrl);
        setTextContent("");
      } catch (error) {
        if (!isCancelled) {
          setTextContent("");
          setPreviewUrl("");
          showToast?.(getErrorMessage(error, "Unable to load note preview."), "error");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingPreview(false);
        }
      }
    }

    loadPreview();

    return () => {
      isCancelled = true;

      if (nextPreviewUrl) {
        window.URL.revokeObjectURL(nextPreviewUrl);
      }
    };
  }, [note, previewType, showToast]);

  if (!note) {
    return null;
  }

  return (
    <div className="preview-modal" role="dialog" aria-modal="true" aria-labelledby="previewTitle">
      <div className="preview-modal__backdrop" onClick={onClose}></div>
      <div className="preview-modal__panel glass-card">
        <div className="preview-modal__header">
          <div>
            <span className="note-card__chip">{note.subject}</span>
            <h3 id="previewTitle">{note.title}</h3>
            <p>{note.fileName}</p>
          </div>
          <button type="button" className="preview-modal__close" onClick={onClose} aria-label="Close preview">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="preview-modal__body">
          {isLoadingPreview ? <div className="page-status glass-card">Loading preview...</div> : null}

          {previewType === "pdf" && !isLoadingPreview && previewUrl ? (
            <iframe title={note.title} src={previewUrl} className="preview-modal__frame"></iframe>
          ) : null}

          {previewType === "image" && !isLoadingPreview && previewUrl ? (
            <img src={previewUrl} alt={note.title} className="preview-modal__image" />
          ) : null}

          {previewType === "text" && !isLoadingPreview ? (
            <pre className="preview-modal__text">{textContent || "No text content available."}</pre>
          ) : null}

          {previewType === "unsupported" && !isLoadingPreview ? (
            <div className="preview-modal__fallback glass-card">
              <i className="fa-regular fa-file-lines"></i>
              <h4>Preview not available for this file type</h4>
              <p>
                {previewUrl
                  ? "Use the button below to open the protected file in a new tab."
                  : "The protected file could not be loaded for preview."}
              </p>
              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="btn btn--primary">
                  Open File
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function getPreviewType(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  if (extension === "pdf") {
    return "pdf";
  }

  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) {
    return "image";
  }

  if (["txt", "md"].includes(extension)) {
    return "text";
  }

  return "unsupported";
}
