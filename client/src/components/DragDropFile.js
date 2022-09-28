import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

function DragDropFile({
  dropView,
  onFilesTransfer,
  reset = false,
  accept = "",
  multiple = true,
}) {
  const [dragActive, setDragActive] = React.useState(false);
  const [hasDropedFile, setHasDropedFile] = useState(false);
  useEffect(() => {
    if (reset) {
      setDragActive(false);
      setHasDropedFile(false);
    }
  }, [reset]);
  const handleDrag = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const onDataTransfer = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHasDropedFile(true);
    if (!hasDropedFile && typeof onFilesTransfer === "function") {
      const files = [];
      if (e.dataTransfer && files) {
        for (let file of e.dataTransfer.files) {
          if (file.type.indexOf(accept) >= 0) files.push(file);
        }
        files.length && onFilesTransfer(files);
      } else if (e.target.files) onFilesTransfer(e.target.files);
    }
  };
  const inputRef = useRef();
  return (
    <div
      id="form-file-upload"
      onClick={(e) => {
        e.stopPropagation();
        inputRef.current.click();
      }}
      onDrop={onDataTransfer}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      style={{
        border: dragActive ? "1px solid red" : "1px solid green",
        height: "300px",
        position: "relative",
      }}
    >
      <input
        type="file"
        ref={inputRef}
        accept={
          {
            audio: "audio/*",
            image: "image/*",
            video: "video/*",
          }[accept]
        }
        id="input-file-upload"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={onDataTransfer}
      />
      <label
        id="label-file-upload"
        htmlFor="input-file-upload"
        style={{ border: dragActive ? "border 1px solid red" : "" }}
      >
        <div>
          <p>Drag and drop your file here or</p>
          {/* <button className="upload-button">Upload a file</button> */}
        </div>
      </label>
      {hasDropedFile ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
            width: "100%",
            height: "100%",
            border: "1px solid pink",
          }}
        >
          {dropView}
        </div>
      ) : null}
    </div>
  );
}

DragDropFile.propTypes = {};

export default DragDropFile;
