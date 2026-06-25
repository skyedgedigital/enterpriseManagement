import { InfoIcon } from 'lucide-react';

const InfoStripe = ({
  text = '',
  className = '',
}: {
  text: string;
  className?: string;
}) => {
  return (
    <div
      className={`flex items-center gap-2 w-fit rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 ${className}`}
    >
      <InfoIcon className='h-5 w-5 shrink-0 text-amber-500 mt-0.5 sm:mt-0' />
      <p className=' leading-tight'>{text}</p>
    </div>
  );
};

export default InfoStripe;
