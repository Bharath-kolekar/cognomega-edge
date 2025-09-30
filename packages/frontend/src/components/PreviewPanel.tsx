import React from 'react';

export interface PreviewPanelProps {
  code: string;
  framework: string;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, framework }) => {
  // TODO: Implement real-time transpilation/rendering for each framework
  return (
    <div style={{ border: '1px solid #eee', padding: 16 }}>
      <h2>Live Preview ({framework})</h2>
      <pre style={{ background: '#f8f8f8', padding: 8 }}>{code}</pre>
    </div>
  );
};