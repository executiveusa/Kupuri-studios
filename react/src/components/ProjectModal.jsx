import React from 'react';

function ProjectModal({ project, onClose }) {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full p-8">
        <button
          className="absolute top-4 right-4 text-2xl text-gray-300 hover:text-white focus:outline-none"
          aria-label="Close modal"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">{project.title}</h2>
        {project.subtitle && <p className="text-lg text-gray-300 mb-4">{project.subtitle}</p>}
        <img src={project.imageSrc} alt={project.altText || project.title} className="rounded-lg mb-4 w-full object-cover" />
        <p className="text-gray-200 mb-6">{project.description}</p>
        {project.siteUrl && (
          <a
            href={project.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-accent text-white font-semibold rounded-lg shadow hover:bg-accent-dark transition-colors"
          >
            Open Project Site
          </a>
        )}
      </div>
    </div>
  );
}

export default ProjectModal;
