export default function AdSpace({ format = 'horizontal', className = '' }: { format?: 'horizontal' | 'vertical' | 'square', className?: string }) {
  const dimensions = {
    horizontal: 'w-full h-24',
    vertical: 'w-full h-[600px]',
    square: 'w-full aspect-square',
  };

  return (
    <div className={`bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 text-sm ${dimensions[format]} ${className}`}>
      <span className="uppercase tracking-widest text-xs font-semibold mb-1">Publicidade</span>
      <span className="text-xs opacity-70">Espaço para Google AdSense</span>
    </div>
  );
}
