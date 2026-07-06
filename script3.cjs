const fs = require('fs');

const filePath = 'src/pages/AdminPanelPro.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for AdminLayout if not present
if (!content.includes('import AdminLayout')) {
    content = content.replace(
        "import './AdminPanelPro.css';",
        "import './AdminPanelPro.css';\nimport AdminLayout from '../components/admin/AdminLayout';"
    );
}

const lines = content.split('\n');

const returnIdx = lines.findIndex(l => l.includes('<div className="admin-panel-pro admin-container">'));
const mainIdx = lines.findIndex((l, i) => i > returnIdx && l.includes('<main className="admin-main">'));

if (returnIdx > -1 && mainIdx > -1) {
    const replacementBefore = `  return (
    <AdminLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={() => {
        localStorage.removeItem('vincanto_admin_session');
        localStorage.removeItem('vincanto_admin_token');
        localStorage.removeItem('vincanto_admin_role');
        window.location.href = '/admin/login';
      }}
      isSuperAdmin={isSuperAdmin()}
      adminEmail={localStorage.getItem('vincanto_admin_email') || 'Admin'}
    >
      <div className="admin-panel-pro admin-container">
        {/* Contenuto Principale Responsive */}
        <div className="admin-main">`;

    lines.splice(returnIdx - 1, (mainIdx - returnIdx + 2), replacementBefore);
} else {
    console.error('Could not find start bounds:', returnIdx, mainIdx);
}

const endMainIdx = lines.findLastIndex(l => l.includes('</main>'));
if (endMainIdx > -1) {
    const endReplacement = `        </div>
      </div>
    </AdminLayout>`;
    lines.splice(endMainIdx, 1, endReplacement);
} else {
    console.error('Could not find end bounds.');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Success!');
