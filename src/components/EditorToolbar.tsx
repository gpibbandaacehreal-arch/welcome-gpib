import React from 'react';

const EditorToolbar: React.FC = () => (
  <div id="toolbar" className="editor-toolbar">
    <span className="ql-formats">
      <select className="ql-header" defaultValue="">
        <option value="1">Judul 1</option>
        <option value="2">Judul 2</option>
        <option value="">Normal</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered" />
      <button className="ql-list" value="bullet" />
    </span>
    <span className="ql-formats">
      <button className="ql-link" />
      <button className="ql-image" />
    </span>
    <span className="ql-formats">
      <button className="ql-align" value="" />
      <button className="ql-align" value="center" />
      <button className="ql-align" value="right" />
      <button className="ql-align" value="justify" />
    </span>
    <span className="ql-formats">
      <button className="ql-clean" />
    </span>
  </div>
);

export default EditorToolbar;
