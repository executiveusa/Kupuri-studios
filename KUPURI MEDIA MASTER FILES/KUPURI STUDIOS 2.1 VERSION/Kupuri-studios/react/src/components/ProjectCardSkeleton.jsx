import React from 'react';

function ProjectCardSkeleton() {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-gray-800 shadow-lg animate-pulse">
      {/* Image placeholder */}
      <div className="w-full h-64 bg-gray-700" />
      
      {/* Text placeholders */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="h-6 bg-gray-600 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-600 rounded w-1/2" />
      </div>
    </div>
  );
}

export default ProjectCardSkeleton;
