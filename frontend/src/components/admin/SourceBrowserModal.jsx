import { useState, useEffect } from 'react';
import { X, File, Folder, FolderOpen, ChevronRight, ChevronDown, Loader2, AlertCircle, Code } from 'lucide-react';
import { getSourceTree, getSourceFile } from '../../api/marketplace';

// Build a nested tree from flat ZIP path list
function buildTree(paths) {
  const root = {};
  paths.forEach(p => {
    if (p.endsWith('/')) return;
    const parts = p.split('/').filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      if (i < parts.length - 1) {
        if (!node[part]) node[part] = { _dir: true, _children: {} };
        node = node[part]._children;
      } else {
        node[part] = { _dir: false, _path: p };
      }
    });
  });
  return root;
}

const TEXT_EXTS = new Set([
  'py','js','jsx','ts','tsx','html','htm','css','scss','less',
  'java','kt','swift','go','rs','c','cpp','h','hpp','cs','php','rb',
  'json','xml','yaml','yml','toml','ini','env','sh','bash','md','txt',
  'rst','csv','sql','gitignore','dockerfile','makefile','gradle','xml',
]);

function canPreview(name) {
  const ext = name.split('.').pop().toLowerCase();
  return TEXT_EXTS.has(ext) || !name.includes('.');
}

function TreeNode({ name, node, depth, onFileClick, selectedPath }) {
  const [open, setOpen] = useState(depth === 0);
  const indent = { paddingLeft: `${depth * 16 + 8}px` };

  if (!node._dir) {
    const active = selectedPath === node._path;
    return (
      <div
        style={indent}
        onClick={() => canPreview(name) && onFileClick(node._path)}
        className={`flex items-center gap-1.5 py-0.5 pr-2 rounded text-xs font-mono select-none
          ${canPreview(name) ? 'cursor-pointer' : 'cursor-default opacity-50'}
          ${active ? 'bg-blue-100 text-blue-800' : 'text-gray-700 hover:bg-gray-100'}`}
        title={node._path}
      >
        <File className="w-3 h-3 shrink-0 text-gray-400" />
        <span className="truncate">{name}</span>
        {!canPreview(name) && <span className="text-gray-300 ml-1 text-[10px]">binary</span>}
      </div>
    );
  }

  const entries = Object.entries(node._children).sort(([, a], [, b]) => {
    if (a._dir === b._dir) return 0;
    return a._dir ? -1 : 1;
  });

  return (
    <div>
      <div
        style={indent}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 py-0.5 pr-2 cursor-pointer rounded hover:bg-gray-100 text-xs font-mono text-gray-800 select-none"
      >
        {open
          ? <ChevronDown className="w-3 h-3 shrink-0 text-gray-400" />
          : <ChevronRight className="w-3 h-3 shrink-0 text-gray-400" />}
        {open
          ? <FolderOpen className="w-3.5 h-3.5 shrink-0 text-yellow-500" />
          : <Folder className="w-3.5 h-3.5 shrink-0 text-yellow-500" />}
        <span>{name}</span>
      </div>
      {open && entries.map(([childName, childNode]) => (
        <TreeNode
          key={childName}
          name={childName}
          node={childNode}
          depth={depth + 1}
          onFileClick={onFileClick}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}

export default function SourceBrowserModal({ project, onClose }) {
  const [tree, setTree] = useState(null);
  const [treeError, setTreeError] = useState('');
  const [selectedPath, setSelectedPath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    getSourceTree(project.id)
      .then(r => setTree(buildTree(r.data.files)))
      .catch(e => setTreeError(e.response?.data?.detail || 'Failed to load source tree.'));
  }, [project.id]);

  const handleFileClick = (path) => {
    setSelectedPath(path);
    setFileContent('');
    setFileError('');
    setFileLoading(true);
    getSourceFile(project.id, path)
      .then(r => setFileContent(r.data.content))
      .catch(e => setFileError(e.response?.data?.detail || 'Failed to load file.'))
      .finally(() => setFileLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-5xl" style={{ height: '85vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">{project.title}</span>
            <span className="text-gray-400 text-sm">— Source Browser</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* File tree */}
          <div className="w-64 shrink-0 border-r border-gray-200 overflow-y-auto py-2 bg-gray-50">
            {!tree && !treeError && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}
            {treeError && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" /> {treeError}
              </div>
            )}
            {tree && Object.entries(tree).sort(([, a], [, b]) => {
              if (a._dir === b._dir) return 0;
              return a._dir ? -1 : 1;
            }).map(([name, node]) => (
              <TreeNode
                key={name}
                name={name}
                node={node}
                depth={0}
                onFileClick={handleFileClick}
                selectedPath={selectedPath}
              />
            ))}
          </div>

          {/* File content */}
          <div className="flex-1 overflow-auto bg-gray-950 text-gray-100">
            {!selectedPath && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <File className="w-10 h-10 opacity-30" />
                <span className="text-sm">Select a file to view its contents</span>
              </div>
            )}
            {selectedPath && fileLoading && (
              <div className="flex items-center justify-center h-full gap-2 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            )}
            {selectedPath && fileError && (
              <div className="flex items-center gap-2 p-6 text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0" /> {fileError}
              </div>
            )}
            {selectedPath && !fileLoading && fileContent && (
              <div className="flex flex-col h-full">
                <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500 font-mono shrink-0">
                  {selectedPath}
                </div>
                <pre className="flex-1 overflow-auto p-4 text-xs font-mono leading-relaxed text-gray-200 whitespace-pre">
                  {fileContent}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
