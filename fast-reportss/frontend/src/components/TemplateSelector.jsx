import templates from '../templates/flyerTemplates.json';

export default function TemplateSelector({ onSelect, onClose }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: '20px' }}>Выберите шаблон</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
          gap: '16px' 
        }}>
          {templates.templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template.data)}
              style={{
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  borderColor: '#4f46e5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4f46e5';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {template.name.split(' ')[0]}
              </div>
              <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>
                {template.name}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                {template.description}
              </p>
            </div>
          ))}
        </div>
        
        <button 
          onClick={onClose}
          style={{
            marginTop: '24px',
            padding: '10px 24px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}