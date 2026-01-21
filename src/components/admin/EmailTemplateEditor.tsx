
import React, { useRef, useEffect, useState } from 'react';

// Editor caricato solo lato client tramite import() dinamico
const FallbackEditor = () => <div>Editor non disponibile in build</div>;

interface EmailTemplateEditorProps {
  initialHtml?: string;
  onSave?: (html: string) => void;
}


const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({ initialHtml, onSave }) => {
  const emailEditorRef = useRef<any>(null);
  const [EmailEditor, setEmailEditor] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  // Carica dinamicamente il componente solo lato client
  useEffect(() => {
    let mounted = true;
    if (typeof window !== 'undefined') {
      import('react-email-editor').then(mod => {
        if (mounted) setEmailEditor(() => mod.default);
      }).catch(() => setEmailEditor(() => FallbackEditor));
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (loaded && initialHtml && emailEditorRef.current) {
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
        {EmailEditor ? (
          <EmailEditor
            ref={emailEditorRef}
            minHeight={600}
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <FallbackEditor />
        )}
      </div>
      <button className="admin-btn-primary" onClick={handleSave}>
        Salva Template
      </button>
    </div>
  );
};

export default EmailTemplateEditor;
