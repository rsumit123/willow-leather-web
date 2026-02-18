import clsx from 'clsx';

interface FormBadgeProps {
  form: number;
  size?: 'sm' | 'md';
}

function getFormConfig(form: number) {
  if (form >= 1.15) return { label: 'Hot', color: 'text-green-400 bg-green-400/10 border-green-400/30' };
  if (form >= 1.05) return { label: 'In Form', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' };
  if (form >= 0.95) return { label: 'Normal', color: 'text-dark-400 bg-dark-400/10 border-dark-400/30' };
  if (form >= 0.85) return { label: 'Cold', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' };
  return { label: 'Poor', color: 'text-red-400 bg-red-400/10 border-red-400/30' };
}

export function FormBadge({ form, size = 'sm' }: FormBadgeProps) {
  // Don't show badge for default/unset form
  if (form === undefined || form === null || (form >= 0.99 && form <= 1.01)) return null;

  const { label, color } = getFormConfig(form);

  return (
    <span
      className={clsx(
        'inline-flex items-center border rounded-full font-medium',
        color,
        size === 'sm' ? 'text-[9px] px-1.5 py-0' : 'text-[10px] px-2 py-0.5',
      )}
    >
      {label}
    </span>
  );
}
