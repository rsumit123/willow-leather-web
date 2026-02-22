import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface SubPageHeaderProps {
  title: string;
  showBack?: boolean;
  backTo?: string;
  action?: React.ReactNode;
}

export function SubPageHeader({ title, showBack, backTo = '/dashboard', action }: SubPageHeaderProps) {
  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              to={backTo}
              className="p-1.5 -ml-1.5 hover:bg-dark-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-dark-300" />
            </Link>
          )}
          <h1 className="font-display font-bold text-lg text-white">{title}</h1>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
