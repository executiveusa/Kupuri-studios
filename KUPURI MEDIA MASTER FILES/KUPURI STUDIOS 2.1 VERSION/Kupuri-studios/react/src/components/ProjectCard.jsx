import Image from 'next/image';
import { useState } from 'react';

function ProjectCard({ project, onClick }) {
  // project: { id, title, subtitle, imageSrc, altText }
  const { title, subtitle, imageSrc, altText } = project;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="group relative rounded-xl overflow-hidden bg-gray-800 shadow-lg cursor-pointer focus:outline-none focus:ring-4 focus:ring-accent"
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
      role="button"
      tabIndex={0}
      aria-label={`View project: ${title}`}
    >
      {/* Project image with blur-up effect */}
      <div className={`transition-all duration-500 ease-out ${imageLoaded ? 'scale-100 blur-0' : 'scale-105 blur-lg'} group-hover:scale-105 group-hover:blur-0`}>
        <Image
          src={imageSrc}
          alt={altText || title}
          width={800}
          height={600}
          className="object-cover w-full h-full"
          onLoadingComplete={() => setImageLoaded(true)}
          placeholder="blur"
          blurDataURL="/placeholder.png"
        />
      </div>
      {/* Overlay with title and subtitle */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-colors duration-300 ease-in-out">
        <h3 className="text-xl md:text-2xl font-semibold text-white drop-shadow-md">{title}</h3>
        {subtitle && (
          <p className="mt-1 text-sm md:text-base text-gray-200 drop-shadow">{subtitle}</p>
        )}
      </div>
      {/* Hover overlay for affordance */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none" />
    </div>
  );
}

export default ProjectCard;
