import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PenLine, Camera, FileJson, Instagram, X } from 'lucide-react';

const SCROLL_THRESHOLD = 100;

export default function MobileAddButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY < SCROLL_THRESHOLD);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const actions = [
    { icon: <PenLine size={18} />, label: 'Manuel', onClick: () => navigate('/recipes/new') },
    { icon: <Camera size={18} />, label: 'Photos', onClick: () => navigate('/import/ocr') },
    { icon: <FileJson size={18} />, label: 'JSON', onClick: () => navigate('/import/json') },
    { icon: <Instagram size={18} />, label: 'Instagram', disabled: true },
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-30 md:hidden transition-all duration-300 ${visible || open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      {/* Speed dial actions */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[-1]" onClick={() => setOpen(false)} />
          <div className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 mb-2 items-end">
            {actions.map((action) => (
              <button
                key={action.label}
                disabled={action.disabled}
                onClick={() => {
                  setOpen(false);
                  action.onClick?.();
                }}
                className="flex items-center gap-3 group disabled:opacity-40"
              >
                <span className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground group-hover:bg-secondary transition-colors">
                  {action.icon}
                </span>
                <span className="text-sm font-body font-medium bg-card border border-border rounded-lg px-3 py-1.5 shadow-lg whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full gradient-warm text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200"
      >
        {open ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
