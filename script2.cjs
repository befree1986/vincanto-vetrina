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

// 2. Find the main return statement wrapper and header/nav
const returnStartStr = '  return (\n    <div className="admin-panel-pro admin-container">';
const mainStartStr = '      {/* Contenuto Principale Responsive */}\n      <main className="admin-main">';

const returnStartIdx = content.indexOf(returnStartStr);
const mainStartIdx = content.indexOf(mainStartStr);

if (returnStartIdx > -1 && mainStartIdx > -1) {
    const replacementStr = `  return (
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

    const beforeRender = content.substring(0, returnStartIdx);
    const afterMain = content.substring(mainStartIdx + mainStartStr.length);

    content = beforeRender + replacementStr + afterMain;
} else {
    console.error('Could not find render block bounds.');
}

// 3. Replace the closing tags at the very end
const endStr = `        {/* Fine sezioni amministrative */}
      </main>
    </div>
  );
};`;

const endReplacement = `        {/* Fine sezioni amministrative */}
        </div>
      </div>
    </AdminLayout>
  );
};`;

if (content.includes(endStr)) {
    content = content.replace(endStr, endReplacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('AdminPanelPro.tsx successfully updated with AdminLayout.');
} else {
    console.error('Could not find the end block.');
}
