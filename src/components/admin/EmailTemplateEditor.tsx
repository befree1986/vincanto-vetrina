import React, { useRef, useEffect, useState } from 'react';

// Import dinamico solo lato client per evitare errori in build/SSR
const isClient = typeof window !== 'undefined';
let EmailEditor: any = () => <div>Editor non disponibile in build</div>;
if (isClient) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  EmailEditor = require('react-email-editor').default;
}

interface EmailTemplateEditorProps {
  initialHtml?: string;
  onSave?: (html: string) => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({ initialHtml, onSave }) => {
  const emailEditorRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded && initialHtml && emailEditorRef.current) {
      // Carica il design HTML se fornito
      emailEditorRef.current.loadDesign({ html: initialHtml });
    }
  }, [loaded, initialHtml]);

  const handleSave = () => {
    if (emailEditorRef.current) {
      emailEditorRef.current.exportHtml((data: any) => {
        if (onSave) onSave(data.html);
        alert('Template salvato!');
      });
    }
  };

  return (
    <div>
      <h2>Editor Template Email</h2>
      <div style={{ minHeight: 600, border: '1px solid #ddd', marginBottom: 16 }}>
        <EmailEditor
          ref={emailEditorRef}
          minHeight={600}
          onLoad={() => setLoaded(true)}
        />
      </div>
      <button className="admin-btn-primary" onClick={handleSave}>
        Salva Template
      </button>
    </div>
  );
};

export default EmailTemplateEditor;
