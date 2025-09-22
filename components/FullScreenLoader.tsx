import React from 'react';
import { LoaderCircle } from 'lucide-react';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <LoaderCircle className="h-12 w-12 text-brand-blue animate-spin" />
    </div>
  );
};

export default FullScreenLoader;
